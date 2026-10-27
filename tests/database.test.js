import { describe, test, expect, afterEach } from 'vitest';
import { createRepository, LEGACY_KEYS } from '../src/services/database.js';
import { removeDemo } from '../src/lib/board.js';
import demo from '../src/data/demo.js';
const repositories = [];
function make(storage = new Map(), name = 'test-' + crypto.randomUUID()) {
  const repo = createRepository({ name, legacyStorage: { getItem: key => storage.get(key) ?? null, removeItem: key => storage.delete(key) } }); repositories.push(repo); return repo;
}
afterEach(async () => { for (const repo of repositories.splice(0)) await repo.db.delete(); });
describe('Dexie persistence and migrations', () => {
  test('seeds once and does not restore removed demo data on reopen', async () => {
    const repo = make(); await repo.open(); expect((await repo.readBoard()).ideas).toHaveLength(demo.ideas.length);
    await repo.update(removeDemo);
    const second = make(new Map(), repo.db.name); await second.open(); expect(await second.readBoard()).toEqual({ schemaVersion: 1, themes: [], ideas: [] }); second.close();
  });
  test('migrates an empty localStorage board without reseeding it', async () => {
    const legacy = new Map([[LEGACY_KEYS.board, JSON.stringify({ schemaVersion: 1, themes: [], ideas: [] })]]);
    const repo = make(legacy); await repo.open(); expect((await repo.readBoard()).ideas).toHaveLength(0); expect(legacy.has(LEGACY_KEYS.board)).toBe(false);
  });
  test('migrates old content/settings/key only after commit and exports no credentials', async () => {
    const board = structuredClone(demo); board.ideas[0].notes = 'A real saved note';
    const legacy = new Map([[LEGACY_KEYS.board, JSON.stringify(board)], [LEGACY_KEYS.appearance, 'dark'], [LEGACY_KEYS.youtube, JSON.stringify({ mode: 'public', channel: '@example', clientId: '' })], [LEGACY_KEYS.key, 'synthetic-remembered-key']]);
    const repo = make(legacy); await repo.open(); expect((await repo.readBoard()).ideas[0].notes).toBe('A real saved note'); expect(await repo.getSetting('appearance')).toBe('dark'); expect(await repo.getApiKey()).toBe('synthetic-remembered-key'); expect(JSON.stringify(await repo.readBoard())).not.toContain('synthetic-remembered-key'); expect(legacy.size).toBe(0);
  });
  test('invalid legacy backup is not overwritten and initialization can be retried', async () => {
    const legacy = new Map([[LEGACY_KEYS.board, '{broken-json']]); const repo = make(legacy);
    await expect(repo.open()).rejects.toThrow('could not be migrated'); expect(legacy.get(LEGACY_KEYS.board)).toBe('{broken-json'); expect(await repo.db.meta.get('initialized')).toBeUndefined();
    legacy.set(LEGACY_KEYS.board, JSON.stringify(demo)); await repo.open(); expect((await repo.readBoard()).ideas).toHaveLength(demo.ideas.length);
  });
  test('a failed write rolls back all tables', async () => {
    const repo = make(); await repo.open(); const before = await repo.readBoard();
    const hook = () => { throw Error('Simulated storage failure'); }; repo.db.ideas.hook('creating', hook);
    await expect(repo.update(b => b)).rejects.toThrow('Simulated storage failure'); repo.db.ideas.hook('creating').unsubscribe(hook);
    expect(await repo.readBoard()).toEqual(before);
  });
  test('concurrent edits do not lose content and stale Undo cannot overwrite a newer edit', async () => {
    const repo = make(); await repo.open();
    const [one] = await Promise.all([repo.update(b => { b.ideas[0].notes = 'First update'; return b; }), repo.update(b => { b.ideas[1].notes = 'Second update'; return b; })]);
    const saved = await repo.readBoard(); expect(saved.ideas[0].notes).toBe('First update'); expect(saved.ideas[1].notes).toBe('Second update');
    await expect(repo.update(() => one.before, one.revision)).rejects.toThrow('changed since');
  });
  test('forgotten API key and cleared cache are deleted from IndexedDB', async () => {
    const repo = make(); await repo.open(); await repo.setApiKey('synthetic-key'); await repo.setCache({ fetchedAt: new Date().toISOString(), videos: [] }); await repo.setApiKey(''); await repo.setCache(null); expect(await repo.db.credentials.count()).toBe(0); expect(await repo.db.youtubeCache.count()).toBe(0);
  });
});
