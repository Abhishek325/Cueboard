import { test, expect } from 'vitest';
import { effectScope } from 'vue';
import { previewIdeas, appendIdeas, planIdeaImport } from '../src/lib/bulk-ideas.js';
import { createRepository } from '../src/services/database.js';
import { useBoard } from '../src/composables/useBoard.js';
const empty = () => ({ schemaVersion: 1, themes: [], ideas: [] });
const payload = overrides => ({ text: 'A useful first video\nAnother useful lesson', newThemeName: 'Tutorials', format: 'Reel + Short', ...overrides });
test('preview removes simple list markers and flags case/space duplicates without hiding bad rows', () => {
  const result = previewIdeas(' \n1. First idea\n- First   idea\n• Existing title\n* Final idea\n' + 'x'.repeat(241), [{ title: 'existing TITLE' }]);
  expect(result.titles).toEqual(['First idea', 'Final idea']);
  expect(result.skipped).toBe(2);
  expect(result.rows.map(row => row.status)).toEqual(['ready', 'duplicate', 'duplicate', 'ready', 'error']);
  expect(result.errors).toHaveLength(1);
  expect(previewIdeas(Array.from({ length: 201 }, (_, n) => 'Idea ' + n).join('\n')).errors[0]).toContain('200');
});
test('import plans enforce board limits and refuse removed/duplicate themes or unsupported formats', () => {
  const board = appendIdeas(empty(), payload());
  expect(() => planIdeaImport(board, payload())).toThrow('No new ideas');
  expect(() => planIdeaImport(board, payload({ text: 'New', newThemeName: 'tutorials' }))).toThrow('already exists');
  expect(() => planIdeaImport(board, { text: 'New', themeId: 'removed', format: 'Carousel' })).toThrow('Choose a theme');
  expect(() => planIdeaImport(board, payload({ text: 'New', format: 'Other' }))).toThrow('supported format');
  const full = { ...board, ideas: Array.from({ length: 2000 }, (_, n) => ({ title: 'Old ' + n })) };
  expect(() => planIdeaImport(full, { text: 'New', themeId: board.themes[0].id, format: 'Carousel' })).toThrow('2,000');
  expect(() => planIdeaImport({ ...board, themes: Array.from({ length: 50 }, (_, n) => ({ id: String(n), name: 'Theme ' + n })) }, payload({ text: 'New' }))).toThrow('50 themes');
});
test('transactional import appends once, uses latest duplicates, rejects invalid batches atomically, and Undo restores everything', async () => {
  const repo = createRepository({ name: 'bulk-' + crypto.randomUUID(), legacyStorage: null, seedDemo: false });
  const scope = effectScope(); const b = scope.run(() => useBoard(repo));
  try {
    await b.start();
    expect(await b.importIdeas(payload())).toBe(true);
    let stored = await repo.readBoard();
    expect(stored.themes).toHaveLength(1); expect(stored.ideas).toHaveLength(2);
    expect(stored.ideas.every(idea => !idea.isDemo && idea.status === 'planned')).toBe(true);
    await b.undoLast(); expect(await repo.readBoard()).toEqual(empty());
    await b.importIdeas(payload()); stored = await repo.readBoard();
    const themeId = stored.themes[0].id;
    await repo.update(board => appendIdeas(board, { text: 'Added elsewhere', themeId, format: 'Carousel' }));
    expect(await b.importIdeas({ text: 'Added elsewhere\nFresh idea', themeId, format: 'Carousel' })).toBe(true);
    expect((await repo.readBoard()).ideas.map(idea => idea.title)).toEqual(['A useful first video', 'Another useful lesson', 'Added elsewhere', 'Fresh idea']);
    const before = await repo.readBoard();
    expect(await b.importIdeas(payload({ text: 'Good\n' + 'x'.repeat(241), newThemeName: 'Must not be created' }))).toBe(false);
    expect(await repo.readBoard()).toEqual(before);
    await b.undoLast();
    expect((await repo.readBoard()).ideas.map(idea => idea.title)).toEqual(['A useful first video', 'Another useful lesson', 'Added elsewhere']);
  } finally { scope.stop(); await repo.db.delete(); }
});
