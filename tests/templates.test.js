import { test, expect, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { effectScope } from 'vue';
import Dexie from 'dexie';
import { starterTemplates, boardFromTemplate } from '../src/data/templates.js';
import { validate } from '../src/lib/board.js';
import { createRepository } from '../src/services/database.js';
import { createProjectStore } from '../src/services/projects.js';
import { useProjects } from '../src/composables/useProjects.js';
import TemplatePicker from '../src/components/TemplatePicker.vue';
const repos = [], scopes = [];
function makeRepo(options = {}) { const repo = createRepository({ name: 'templates-' + crypto.randomUUID(), legacyStorage: null, ...options }); repos.push(repo); return repo; }
afterEach(async () => { scopes.splice(0).forEach(scope => scope.stop()); for (const repo of repos.splice(0)) await repo.db.delete(); document.body.innerHTML = ''; });

test('each starter produces valid, fresh, editable content without invented progress or results', () => {
  expect(starterTemplates.map(item => item.id)).toEqual(['educational-shorts', 'building-in-public', 'travel-content']);
  for (const item of starterTemplates) {
    const first = boardFromTemplate(item.id), second = boardFromTemplate(item.id);
    expect(validate(first)).toBe(true); expect(first.themes).toHaveLength(3); expect(first.ideas.length).toBeGreaterThanOrEqual(3);
    const firstIds = new Set([...first.themes, ...first.ideas].map(record => record.id));
    expect([...second.themes, ...second.ideas].every(record => !firstIds.has(record.id))).toBe(true);
    expect(first.ideas.every(idea => idea.status === 'planned' && !idea.selected && !idea.isDemo && idea.demo && idea.value && idea.notes)).toBe(true);
    first.ideas[0].title = 'My edited idea'; expect(second.ideas[0].title).not.toBe('My edited idea');
  }
  expect(() => boardFromTemplate('missing')).toThrow('unavailable');
});

test('template copies preserve the current board and never inherit connection settings, keys or cache', async () => {
  const root = makeRepo(), store = createProjectStore(root, { repositoryFactory: makeRepo }); await store.initialize();
  const before = await root.readBoard(); await root.setSetting('youtube', { channel: '@existing' }); await root.setApiKey('synthetic-only'); await root.setCache({ videos: ['existing'] });
  const project = await store.createFromTemplate('educational-shorts', 'Teaching');
  const scoped = store.forProject(project.id);
  expect((await scoped.readBoard()).ideas).toHaveLength(4); expect(await root.readBoard()).toEqual(before);
  expect((await store.current()).id).toBe('default');
  expect(await scoped.getSetting('youtube')).toBeUndefined(); expect(await scoped.getApiKey()).toBe(''); expect(await scoped.getCache()).toBeNull();
  expect(await root.getApiKey()).toBe('synthetic-only');
  await expect(store.createFromTemplate('travel-content', ' teaching ')).rejects.toThrow('already exists');
  expect((await store.list())).toHaveLength(2);
  await expect(store.createFromTemplate('travel-content', 'x'.repeat(81))).rejects.toThrow('project name');
});

test('a failed template write or registration never exposes an empty project', async () => {
  let fail = true;
  const root = makeRepo(), store = createProjectStore(root, { repositoryFactory: options => {
    const repo = makeRepo(options);
    if (fail) repo.update = vi.fn().mockRejectedValue(Error('Storage full'));
    return repo;
  } });
  await store.initialize();
  await expect(store.createFromTemplate('travel-content', 'Trip')).rejects.toThrow('Storage full');
  expect((await store.list()).map(p => p.id)).toEqual(['default']); expect((await store.current()).id).toBe('default');
  fail = false;
  await root.db.projects.bulkPut(Array.from({ length: 49 }, (_, i) => ({ id: 'project-limit-' + i, name: 'Other ' + i, createdAt: String(i) })));
  await expect(store.createFromTemplate('travel-content', 'Trip')).rejects.toThrow('50 projects');
  expect(await store.list()).toHaveLength(50);
  expect(await Dexie.exists(repos.at(-1).db.name)).toBe(false);
});

test('project manager selects a completed template copy and keeps the old project on failure', async () => {
  const root = makeRepo(), store = createProjectStore(root, { repositoryFactory: makeRepo });
  const scope = effectScope(); scopes.push(scope); const manager = scope.run(() => useProjects(store)); await manager.start();
  expect(await manager.useTemplate('travel-content', 'Travel plans')).toBe(true);
  expect(manager.active.value.name).toBe('Travel plans'); expect((await manager.projectRepository.value.readBoard()).ideas).toHaveLength(4);
  const current = manager.activeId.value;
  expect(await manager.useTemplate('missing', 'Another')).toBe(false); expect(manager.activeId.value).toBe(current); expect(manager.error.value).toContain('unavailable');
});

test('picker previews concrete ideas, suggests unique names, validates names and emits selection', async () => {
  const wrapper = mount(TemplatePicker, { props: { open: true, existingNames: ['Educational Shorts', 'Educational Shorts (2)'] }, attachTo: document.body });
  try {
    expect(wrapper.get('#template-project-name').element.value).toBe('Educational Shorts (3)');
    expect(wrapper.text()).toContain('One messy input, one useful output'); expect(wrapper.text()).toContain('4 editable ideas');
    await wrapper.findAll('.template-option')[2].trigger('click');
    expect(wrapper.text()).toContain('One neighborhood, a realistic half-day route');
    await wrapper.get('#template-project-name').setValue(' Educational Shorts ');
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true);
    await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('use')).toBeUndefined();
    await wrapper.get('#template-project-name').setValue('My travel channel'); await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('use')[0]).toEqual([{ templateId: 'travel-content', name: 'My travel channel' }]);
    await wrapper.setProps({ busy: true }); await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('use')).toHaveLength(1);
  } finally { wrapper.unmount(); }
});
