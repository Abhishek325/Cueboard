import { test, expect } from 'vitest';
import { reorderTheme, reorderIdea } from '../src/lib/reorder.js';
const fixture = () => ({ themes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], ideas: [
  { id: 'first', theme: 'a', status: 'planned', notes: 'Keep this note' },
  { id: 'other', theme: 'b', status: 'planned' },
  { id: 'ongoing', theme: 'a', status: 'progress' },
  { id: 'second', theme: 'a', status: 'planned' },
  { id: 'finished', theme: 'a', status: 'done', previousStatus: 'progress' },
  { id: 'third', theme: 'a', status: 'planned' },
] });
test('theme moves use target positions in either direction without mutating the saved snapshot', () => {
  const board = fixture(), before = structuredClone(board);
  expect(reorderTheme(board, 'c', 'a').themes.map(t => t.id)).toEqual(['c', 'a', 'b']);
  expect(reorderTheme(board, 'a', 'c', true).themes.map(t => t.id)).toEqual(['b', 'c', 'a']);
  expect(reorderTheme(board, 'a', 'a')).toEqual(board);
  expect(board).toEqual(before);
});
test('idea reordering preserves content, statuses and the order of every other group', () => {
  const board = fixture(), before = structuredClone(board);
  const moved = reorderIdea(board, 'third', 'first');
  expect(moved.ideas.filter(i => i.theme === 'a' && i.status === 'planned').map(i => i.id)).toEqual(['third', 'first', 'second']);
  expect(moved.ideas.filter(i => i.status !== 'planned' || i.theme !== 'a')).toEqual(board.ideas.filter(i => i.status !== 'planned' || i.theme !== 'a'));
  expect(moved.ideas.find(i => i.id === 'first').notes).toBe('Keep this note');
  expect(board).toEqual(before);
});
test('removed targets and attempts to cross a theme or status are rejected', () => {
  const board = fixture();
  expect(() => reorderTheme(board, 'a', 'missing')).toThrow('removed');
  expect(() => reorderIdea(board, 'first', 'missing')).toThrow('removed');
  for (const target of ['other', 'ongoing', 'finished']) expect(() => reorderIdea(board, 'first', target)).toThrow('same theme and status');
});
