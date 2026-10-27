import { test, expect, afterEach, vi } from 'vitest';
import Dexie from 'dexie';
import { effectScope, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createRepository } from '../src/services/database.js';
import { createProjectStore } from '../src/services/projects.js';
import ProjectWorkspace from '../src/views/ProjectWorkspace.vue';
import PostingCalendar from '../src/components/PostingCalendar.vue';
import { useYoutube } from '../src/composables/useYoutube.js';
vi.mock('../src/services/google-auth.js', () => ({ loadGoogle: vi.fn(() => Promise.resolve()) }));
const repos = [], scopes = [];
function repository(name = 'projects-test-' + crypto.randomUUID()) {
  const repo = createRepository({ name, legacyStorage: null }); repos.push(repo); return repo;
}
function scoped(store, id) { const repo = store.forProject(id); repos.push(repo); return repo; }
afterEach(async () => { scopes.splice(0).forEach(s => s.stop()); for (const repo of repos.splice(0)) await repo.db.delete(); document.body.innerHTML = ''; });
const board = title => ({ schemaVersion: 1, themes: [{ id: 'shared-theme', name: 'Build' }], ideas: [{ id: 'shared-idea', theme: 'shared-theme', title, status: 'planned', format: 'Reel + Short' }] });
test('upgrades the existing database without replacing board, order, credentials or YouTube data', async () => {
  const name = 'upgrade-' + crypto.randomUUID();
  const old = new Dexie(name);
  old.version(1).stores({ themes: '&id, order', ideas: '&id, theme, status, order', settings: '&key', youtubeCache: '&key', credentials: '&key', meta: '&key' });
  await old.open();
  await old.themes.bulkPut([{ id: 'second', name: 'Second', order: 1 }, { id: 'first', name: 'First', order: 0 }]);
  await old.ideas.put({ id: 'original', theme: 'first', title: 'Original content', status: 'progress', format: 'Reel + Short', order: 0 });
  await old.meta.put({ key: 'initialized', value: true });
  await old.settings.put({ key: 'youtube', value: { mode: 'public', channel: '@original' } });
  await old.credentials.put({ key: 'youtubeApiKey', value: 'synthetic-key' });
  await old.youtubeCache.put({ key: 'current', value: { videos: [{ id: 'original-video' }] } });
  old.close();
  const root = repository(name), store = createProjectStore(root); await store.initialize();
  expect((await store.list()).map(p => p.id)).toEqual(['default']);
  expect((await root.readBoard()).themes.map(t => t.id)).toEqual(['first', 'second']);
  expect((await root.readBoard()).ideas[0].title).toBe('Original content');
  expect(await root.getSetting('youtube')).toEqual({ mode: 'public', channel: '@original' });
  expect(await root.getApiKey()).toBe('synthetic-key');
  expect((await root.getCache()).videos[0].id).toBe('original-video');
});
test('projects isolate content, connection settings, keys, cache and Undo even with identical card IDs', async () => {
  const root = repository(), store = createProjectStore(root); await store.initialize();
  await root.update(() => board('First project'));
  const project = await store.create('Travel'); const other = scoped(store, project.id); await other.open();
  expect(await other.readBoard()).toEqual({ schemaVersion: 1, themes: [], ideas: [] });
  expect(await other.getSetting('youtube')).toBeUndefined(); expect(await other.getApiKey()).toBe(''); expect(await other.getCache()).toBeNull();
  await other.update(() => board('Other project'));
  for (const [repo, name] of [[root, 'first'], [other, 'other']]) {
    await repo.setSetting('youtube', { channel: '@' + name }); await repo.setApiKey(name + '-synthetic-key'); await repo.setCache({ videos: [{ id: name }] });
  }
  const change = await other.update(b => { b.ideas[0].title = 'Edited'; return b; });
  await root.update(b => { b.ideas[0].title = 'First changed'; return b; });
  await other.update(() => change.before, change.revision);
  expect((await other.readBoard()).ideas[0].title).toBe('Other project');
  expect((await root.readBoard()).ideas[0].title).toBe('First changed');
  expect(await root.getApiKey()).toBe('first-synthetic-key'); expect(await other.getApiKey()).toBe('other-synthetic-key');
  expect((await root.getCache()).videos[0].id).toBe('first'); expect((await other.getCache()).videos[0].id).toBe('other');
  expect((await root.getSetting('youtube')).channel).toBe('@first'); expect((await other.getSetting('youtube')).channel).toBe('@other');
  await store.select(project.id); const reloaded = createProjectStore(root); await reloaded.initialize(); expect((await reloaded.current()).id).toBe(project.id);
  await store.rename(project.id, 'Travel films'); expect((await store.current()).name).toBe('Travel films');
  await expect(store.create(' travel films ')).rejects.toThrow('already exists'); await expect(store.create('  ')).rejects.toThrow('project name');
  await expect(store.select('missing')).rejects.toThrow('unavailable');
});
test('sidebar creates an empty project, switches back to existing content and renames the active project', async () => {
  const root = repository(), store = createProjectStore(root); await store.initialize(); await root.update(() => board('Existing personal idea'));
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }, { path: '/privacy', component: { template: '<div />' } }] });
  const wrapper = mount(ProjectWorkspace, { props: { store }, attachTo: document.body, global: { plugins: [router], provide: { appearance: { preference: ref('system'), set: vi.fn() } } } });
  try {
    await vi.waitFor(() => expect(wrapper.text()).toContain('Existing personal idea'));
    await wrapper.get('#project-switcher').setValue('__create__'); await wrapper.get('#project-name').setValue('Travel');
    await wrapper.get('dialog[aria-label="New project"] form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Your next idea starts here.'));
    const project = (await store.list()).find(p => p.name === 'Travel'); scoped(store, project.id);
    expect(wrapper.get('h1').text()).toBe('Travel'); expect(wrapper.findComponent(PostingCalendar).exists()).toBe(false);
    expect(wrapper.find('.empty-board-actions .btn-quiet').text()).toBe('Restore backup');
    expect(wrapper.findAll('button').some(b => b.text() === 'Export backup')).toBe(false);
    expect(wrapper.text()).not.toContain('Existing personal idea');
    expect(wrapper.get('#project-switcher').text()).not.toContain('Rename current project');
    await wrapper.get('[aria-label="Rename project"]').trigger('click');
    await wrapper.get('.project-name-input').setValue('Travel stories');
    await wrapper.get('.project-name-input').trigger('blur');
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Travel stories'));
    await wrapper.get('#project-switcher').setValue('default');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Existing personal idea'));
    expect(wrapper.get('h1').text()).toBe('Content board');
    await wrapper.get('#project-switcher').setValue(project.id);
    await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Travel stories'));
    expect(wrapper.text()).not.toContain('Existing personal idea');
    expect((await store.current()).id).toBe(project.id);
    await vi.waitFor(() => expect(wrapper.get('button[aria-label="Delete project"]').element.disabled).toBe(false));
    await wrapper.get('button[aria-label="Delete project"]').trigger('click');
    expect(wrapper.get('dialog[aria-label="Delete project"]').text()).toContain('Travel stories');
    await wrapper.get('dialog[aria-label="Delete project"] .btn-quiet').trigger('click');
    expect((await store.list()).some(p => p.id === project.id)).toBe(true);
    await vi.waitFor(() => expect(wrapper.get('button[aria-label="Delete project"]').element.disabled).toBe(false));
    await wrapper.get('button[aria-label="Delete project"]').trigger('click');
    await wrapper.get('dialog[aria-label="Delete project"] .btn-danger').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Existing personal idea'));
    expect(wrapper.get('#project-switcher').text()).not.toContain('Travel stories');
  } finally { wrapper.unmount(); await flushPromises(); }
});
test('leaving a project during a YouTube request cancels its late response without saving it', async () => {
  const root = repository(), store = createProjectStore(root); await store.initialize();
  const project = await store.create('Second'); const other = scoped(store, project.id); await other.open();
  let finish; const scope = effectScope(); scopes.push(scope);
  const y = scope.run(() => useYoutube(() => [], root, () => new Promise(resolve => { finish = resolve; }))); await y.start();
  const form = { mode: 'public', channel: '@example', clientId: '', days: 28, apiKey: 'synthetic-session-key-not-real', remember: false, agree: true };
  y.connect(form); await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  scope.stop();
  finish({ mode: 'public', channelTarget: '@example', channelId: 'UC' + 'a'.repeat(22), fetchedAt: new Date().toISOString(), videos: [], reports: {} });
  await flushPromises();
  expect(await root.getCache()).toBeNull(); expect(await other.getCache()).toBeNull(); expect(await other.getSetting('youtube')).toBeUndefined();
});

test('deleting a project clears its content and YouTube data without changing another project', async () => {
  const root = repository(), store = createProjectStore(root); await store.initialize();
  await root.update(() => board('Keep this')); await root.setSetting('appearance', 'dark');
  const project = await store.create('Disposable'); const other = scoped(store, project.id); await other.open();
  await other.update(() => board('Remove this')); await other.setApiKey('synthetic-delete-key');
  await other.setSetting('youtube', { channel: '@dispose' }); await other.setCache({ videos: [{ id: 'dispose' }] });
  await store.select(project.id); expect((await store.remove(project.id)).id).toBe('default');
  expect((await store.list()).map(p => p.id)).toEqual(['default']);
  expect((await root.readBoard()).ideas[0].title).toBe('Keep this');
  expect((await other.readBoard()).ideas).toHaveLength(0); expect(await other.getApiKey()).toBe('');
  expect(await other.getCache()).toBeNull(); expect(await other.getSetting('youtube')).toBeUndefined();
  expect(await root.getSetting('appearance')).toBe('dark');
});
test('deleting the original and final project creates one empty board without resurrecting old data on reload', async () => {
  const root = repository(), store = createProjectStore(root); await store.initialize();
  await root.update(() => board('Delete original')); await root.setSetting('appearance', 'dark');
  await root.setApiKey('synthetic-original-key'); await root.setSetting('youtube', { channel: '@original' });
  const replacement = await store.remove('default'); const empty = scoped(store, replacement.id);
  expect(replacement.id).not.toBe('default'); expect(replacement.name).toBe('Content board');
  expect((await empty.readBoard()).ideas).toHaveLength(0); expect((await root.readBoard()).ideas).toHaveLength(0);
  expect(await root.getApiKey()).toBe(''); expect(await root.getSetting('youtube')).toBeUndefined();
  expect(await root.getSetting('appearance')).toBe('dark');
  const reloaded = createProjectStore(root); await reloaded.initialize();
  expect((await reloaded.list()).map(p => p.id)).toEqual([replacement.id]);
  expect((await reloaded.current()).id).toBe(replacement.id);
  const next = await store.remove(replacement.id); const last = scoped(store, next.id);
  expect((await last.readBoard()).themes).toHaveLength(0); expect((await store.list()).map(p => p.id)).toEqual([next.id]);
});
