import { createRepository, repository } from './database.js';
import { boardFromTemplate } from '../data/templates.js';
export const DEFAULT_PROJECT = { id: 'default', name: 'Content board', createdAt: '1970-01-01T00:00:00.000Z' };
export function createProjectStore(root = repository, { repositoryFactory = createRepository } = {}) {
  const repositories = new Map([['default', root]]);
  async function initialize() {
    await root.open();
    await root.db.transaction('rw', root.db.projects, root.db.meta, async () => {
      if (!await root.db.meta.get('projectsInitialized')) {
        if (!await root.db.projects.count()) await root.db.projects.put({ ...DEFAULT_PROJECT });
        await root.db.meta.put({ key: 'projectsInitialized', value: true });
      }
    });
  }
  async function list() { return root.db.projects.orderBy('createdAt').toArray(); }
  function cleanName(value) {
    const name = String(value || '').trim();
    if (!name || name.length > 80) throw Error('Enter a project name between 1 and 80 characters.');
    return name;
  }
  async function saveName(name, id) {
    name = cleanName(name);
    return root.db.transaction('rw', root.db.projects, async () => {
      const projects = await list();
      if (projects.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) throw Error('A project with that name already exists.');
      let project = id ? projects.find(p => p.id === id) : null;
      if (id && !project) throw Error('That project is unavailable.');
      if (!id && projects.length >= 50) throw Error('You can create up to 50 projects.');
      project = project || { id: 'project-' + crypto.randomUUID(), createdAt: new Date().toISOString() };
      const saved = { ...project, name };
      await root.db.projects.put(saved);
      return saved;
    });
  }
  async function select(id) {
    if (!await root.db.projects.get(id)) throw Error('That project is unavailable.');
    await root.setSetting('activeProject', id);
  }
  async function current() {
    const id = await root.getSetting('activeProject');
    return await root.db.projects.get(id || 'default') || (await list())[0];
  }
  function forProject(id) {
    if (id !== 'default' && !/^project-[\w-]{1,100}$/.test(id)) throw Error('Invalid project.');
    if (!repositories.has(id)) repositories.set(id, repositoryFactory({ name: root.db.name + '-' + id, legacyStorage: null, seedDemo: false }));
    return repositories.get(id);
  }
  async function createFromTemplate(templateId, rawName) {
    const name = cleanName(rawName), board = boardFromTemplate(templateId);
    const project = { id: 'project-' + crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    const target = forProject(project.id);
    try {
      // Prepare the entire scoped board before exposing it in the project list.
      // Databases cannot share a transaction: failed registration deletes this new database.
      await target.open();
      await target.update(() => board);
      await root.db.transaction('rw', root.db.projects, async () => {
        const projects = await list();
        if (projects.length >= 50) throw Error('You can create up to 50 projects.');
        if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) throw Error('A project with that name already exists.');
        await root.db.projects.add(project);
      });
      return project;
    } catch (error) {
      target.close();
      try { await target.db.delete(); } finally { repositories.delete(project.id); }
      throw error;
    }
  }
  async function remove(id) {
    if (!await root.db.projects.get(id)) throw Error('That project is unavailable.');
    let remaining = (await list()).filter(p => p.id !== id);
    // Keep a usable empty workspace when the final project is removed.
    const replacement = remaining.length ? null : { id: 'project-' + crypto.randomUUID(), name: 'Content board', createdAt: new Date().toISOString() };
    if (replacement) { await forProject(replacement.id).open(); remaining = [replacement]; }
    const next = remaining[0];
    const target = forProject(id); await target.open();
    async function clearContent() {
      await target.db.themes.clear(); await target.db.ideas.clear();
      await target.db.credentials.clear(); await target.db.youtubeCache.clear();
      await target.db.settings.delete('youtube');
      await target.db.meta.put({ key: 'revision', value: 0 });
    }
    const contentTables = [target.db.themes, target.db.ideas, target.db.credentials, target.db.youtubeCache, target.db.settings, target.db.meta];
    // The original project shares the registry database, so remove it atomically.
    if (id !== 'default') await target.db.transaction('rw', contentTables, clearContent);
    await root.db.transaction('rw', id === 'default' ? [...contentTables, root.db.projects] : [root.db.projects, root.db.settings], async () => {
      if (id === 'default') await clearContent();
      if (replacement) await root.db.projects.put(replacement);
      await root.db.projects.delete(id);
      await root.setSetting('activeProject', next.id);
    });
    return next;
  }
  return { initialize, list, current, select, forProject, remove, createFromTemplate, create: name => saveName(name), rename: (id, name) => saveName(name, id),
    close() { for (const [id, repo] of repositories) if (id !== 'default') repo.close(); },
  };
}
