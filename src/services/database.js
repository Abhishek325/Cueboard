import Dexie from 'dexie';
import demo from '../data/demo.js';
import { normalize } from '../lib/board.js';
import { fresh } from '../lib/youtube.js';

export const DATABASE_NAME = 'content-board';
export const LEGACY_KEYS = {
  board: 'content-board:data:v1', appearance: 'content-board:appearance:v1',
  youtube: 'content-board:youtube:config:v1', cache: 'content-board:youtube:cache:v1', key: 'content-board:youtube:key:v1',
};
export function clone(value) { return JSON.parse(JSON.stringify(value)); }
export function createRepository({ name = DATABASE_NAME, legacyStorage = globalThis.localStorage, seedDemo = true } = {}) {
  const db = new Dexie(name);
  db.version(1).stores({ themes: '&id, order', ideas: '&id, theme, status, order', settings: '&key', youtubeCache: '&key', credentials: '&key', meta: '&key' });
  db.version(2).stores({ projects: '&id, name, createdAt' });
  let opening;
  const tables = [db.themes, db.ideas, db.meta];
  async function readBoard() {
    return db.transaction('r', db.themes, db.ideas, async () => normalize({ schemaVersion: 1, themes: await db.themes.orderBy('order').toArray(), ideas: await db.ideas.orderBy('order').toArray() }));
  }
  async function writeBoard(board) {
    const clean = normalize(clone(board));
    await db.themes.clear(); await db.ideas.clear();
    await db.themes.bulkPut(clean.themes.map((t, order) => ({ ...t, order })));
    await db.ideas.bulkPut(clean.ideas.map((i, order) => ({ ...i, order })));
    return clean;
  }
  function legacy(key) { try { return legacyStorage?.getItem(key) ?? null; } catch { return null; } }
  async function initialize() {
    const migrated = [];
    await db.transaction('rw', [...tables, db.settings, db.credentials, db.youtubeCache], async () => {
      if (await db.meta.get('initialized')) return;
      let board = seedDemo ? demo : { schemaVersion: 1, themes: [], ideas: [] };
      const raw = legacy(LEGACY_KEYS.board);
      if (raw !== null) {
        try { board = normalize(JSON.parse(raw)); }
        catch { throw new Error('Your previous board could not be migrated. It remains in localStorage and has not been overwritten.'); }
        migrated.push(LEGACY_KEYS.board);
      }
      await writeBoard(board);
      const appearance = legacy(LEGACY_KEYS.appearance);
      if (['light', 'dark', 'system'].includes(appearance)) { await db.settings.put({ key: 'appearance', value: appearance }); migrated.push(LEGACY_KEYS.appearance); }
      let config;
      try { config = JSON.parse(legacy(LEGACY_KEYS.youtube) || 'null'); } catch { /* Ignore invalid optional connection settings. */ }
      if (config && ['public', 'owner'].includes(config.mode) && typeof config.channel === 'string' && typeof config.clientId === 'string') {
        await db.settings.put({ key: 'youtube', value: { mode: config.mode, channel: config.channel, clientId: config.clientId, days: 28 } }); migrated.push(LEGACY_KEYS.youtube);
        let cache; try { cache = JSON.parse(legacy(LEGACY_KEYS.cache) || 'null'); } catch { /* No usable snapshot. */ }
        if (cache && fresh(cache) && cache.mode === config.mode && cache.channelTarget === config.channel && Array.isArray(cache.videos) && cache.videos.length <= 5000 && cache.reports && /^UC[\w-]{22}$/.test(cache.channelId)) {
          await db.youtubeCache.put({ key: 'current', value: cache }); migrated.push(LEGACY_KEYS.cache);
        }
      }
      const key = legacy(LEGACY_KEYS.key);
      if (key) { await db.credentials.put({ key: 'youtubeApiKey', value: key }); migrated.push(LEGACY_KEYS.key); }
      await db.meta.bulkPut([{ key: 'initialized', value: true }, { key: 'revision', value: 0 }]);
    });
    // Cleanup only after the entire IndexedDB transaction commits. A failed migration leaves the source intact.
    migrated.forEach(key => { try { legacyStorage?.removeItem(key); } catch { /* An initialized database ignores any leftover legacy values. */ } });
  }
  async function open() {
    if (!opening) opening = initialize().catch(error => { opening = null; throw error; });
    await opening;
  }
  async function update(transform, expectedRevision) {
    await open();
    return db.transaction('rw', tables, async () => {
      const revision = (await db.meta.get('revision'))?.value || 0;
      if (expectedRevision !== undefined && expectedRevision !== revision) throw new Error('The board changed since that action. Undo is no longer available.');
      const before = await readBoard();
      const board = await writeBoard(transform(clone(before)));
      await db.meta.put({ key: 'revision', value: revision + 1 });
      return { board, before, revision: revision + 1 };
    });
  }
  return { db, open, readBoard, update,
    async getSetting(key) { return (await db.settings.get(key))?.value; },
    async setSetting(key, value) { await db.settings.put({ key, value: clone(value) }); },
    async getCache() { return (await db.youtubeCache.get('current'))?.value || null; },
    async setCache(value) { if (value) await db.youtubeCache.put({ key: 'current', value: clone(value) }); else await db.youtubeCache.delete('current'); },
    async getApiKey() { return (await db.credentials.get('youtubeApiKey'))?.value || ''; },
    async setApiKey(value) { if (value) await db.credentials.put({ key: 'youtubeApiKey', value }); else await db.credentials.delete('youtubeApiKey'); },
    close() { db.close(); },
  };
}
export const repository = createRepository();
