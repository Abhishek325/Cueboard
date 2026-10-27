function move(list, id, targetId, after) {
  const source = list.find(item => item.id === id), target = list.find(item => item.id === targetId);
  if (!source || !target) throw Error('That item was removed.');
  if (id === targetId) return list;
  const result = list.filter(item => item.id !== id);
  result.splice(result.findIndex(item => item.id === targetId) + (after ? 1 : 0), 0, source);
  return result;
}
export function reorderTheme(board, id, targetId, after = false) {
  return { ...board, themes: move(board.themes, id, targetId, after) };
}
export function reorderIdea(board, id, targetId, after = false) {
  const source = board.ideas.find(item => item.id === id), target = board.ideas.find(item => item.id === targetId);
  if (!source || !target) throw Error('That idea was removed.');
  if (source.theme !== target.theme || source.status !== target.status) throw Error('Reorder ideas within the same theme and status. In-progress ideas stay first.');
  return { ...board, ideas: move(board.ideas, id, targetId, after) };
}
