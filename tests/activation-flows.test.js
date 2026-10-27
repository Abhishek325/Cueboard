import { test, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import ProjectWorkspace from '../src/views/ProjectWorkspace.vue';
import BulkIdeaImport from '../src/components/BulkIdeaImport.vue';
import TemplatePicker from '../src/components/TemplatePicker.vue';
import { createRepository } from '../src/services/database.js';
import { createProjectStore } from '../src/services/projects.js';
vi.mock('../src/services/google-auth.js', () => ({ loadGoogle: vi.fn(() => Promise.resolve()) }));
async function harness(initialRoute = '/') {
  const repos = [];
  function make(options) { const r = createRepository({ legacyStorage: null, seedDemo: false, ...options }); repos.push(r); return r; }
  const root = make({ name: 'activation-' + crypto.randomUUID() });
  const store = createProjectStore(root, { repositoryFactory: make }); await store.initialize();
  const original = { schemaVersion: 1, themes: [{ id: 'original', name: 'Original theme' }], ideas: [{ id: 'keep', theme: 'original', title: 'Kept original idea', status: 'planned', format: 'Reel + Short' }] };
  await root.update(() => original);
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }, { path: '/privacy', component: { template: '<div />' } }] });
  await router.push(initialRoute); await router.isReady();
  const wrapper = mount(ProjectWorkspace, { props: { store }, attachTo: document.body, global: { plugins: [router], provide: { appearance: { preference: ref('system'), set: vi.fn() } } } });
  await vi.waitFor(() => expect(wrapper.findAll('.idea-title').map(i => i.text())).toContain('Kept original idea'));
  return { wrapper, root, store, async cleanup() { wrapper.unmount(); await flushPromises(); for (const repo of repos) await repo.db.delete(); document.body.innerHTML = ''; } };
}
function button(wrapper, text) { const found = wrapper.findAll('button').find(b => b.text() === text); if (!found) throw Error('Missing button: ' + text); return found; }
test('bulk import stays hidden while existing board content remains available', async () => {
  const h = await harness();
  try {
    expect(h.wrapper.findAll('button').some(button => button.text() === 'Paste ideas')).toBe(false);
    expect(h.wrapper.findComponent(BulkIdeaImport).props('open')).toBe(false);
    expect((await h.root.readBoard()).ideas.map(idea => idea.title)).toEqual(['Kept original idea']);
  } finally { await h.cleanup(); }
});
test('dropdown template creates a new editable project and leaves the original board and connection untouched', async () => {
  const h = await harness(); const { wrapper, root, store } = h;
  try {
    await root.setSetting('youtube', { mode: 'public', channel: '@original' });
    await root.setApiKey('synthetic-not-a-real-key');
    await wrapper.get('#project-switcher').setValue('__template__');
    const picker = wrapper.findComponent(TemplatePicker);
    expect(picker.props('open')).toBe(true);
    expect(picker.text()).toContain('One messy input, one useful output');
    await picker.get('#template-project-name').setValue('My educational channel');
    await button(picker, 'Use this template').trigger('click');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-title')).toHaveLength(4));
    expect(wrapper.get('h1').text()).toBe('My educational channel');
    const project = await store.current(), scoped = store.forProject(project.id);
    expect((await scoped.readBoard()).themes).toHaveLength(3);
    expect((await scoped.readBoard()).ideas.every(i => i.status === 'planned' && !i.isDemo)).toBe(true);
    expect(await scoped.getApiKey()).toBe(''); expect(await scoped.getSetting('youtube')).toBeUndefined();
    expect((await root.readBoard()).ideas[0].title).toBe('Kept original idea');
    expect(await root.getApiKey()).toBe('synthetic-not-a-real-key');
    await wrapper.get('#project-switcher').setValue('default');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-title').map(i => i.text())).toEqual(['Kept original idea']));
    await wrapper.get('#project-switcher').setValue('__create__');
    await wrapper.get('#project-name').setValue('Empty project');
    await wrapper.get('dialog[aria-label="New project"] form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.find('.empty-board-actions').exists()).toBe(true));
    await button(wrapper, 'Use a template').trigger('click');
    expect(picker.props('open')).toBe(true);
    await button(picker, 'Cancel').trigger('click');
    expect(picker.props('open')).toBe(false);
    expect(wrapper.get('h1').text()).toBe('Empty project');
  } finally { await h.cleanup(); }
});

test('public template links open the matching preview without creating or changing a project', async () => {
  const h = await harness('/?template=travel-content');
  try {
    const picker = h.wrapper.findComponent(TemplatePicker);
    await vi.waitFor(() => expect(picker.props('open')).toBe(true));
    expect(picker.get('[aria-pressed="true"]').text()).toContain('Travel content');
    expect(picker.get('#template-project-name').element.value).toBe('Travel content');
    expect(await h.store.list()).toHaveLength(1);
    expect((await h.root.readBoard()).ideas[0].title).toBe('Kept original idea');
    await button(picker, 'Cancel').trigger('click');
    expect(picker.props('open')).toBe(false); expect(await h.store.list()).toHaveLength(1);
  } finally { await h.cleanup(); }
});
