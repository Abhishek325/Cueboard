import { colors, formats } from './board.js';

export const BULK_IDEA_LIMIT = 200;
export const titleKey = title => title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
export function previewIdeas(text, ideas = []) {
  const seen = new Set(ideas.map(idea => titleKey(idea.title)));
  const rows = String(text || '').split(/\r?\n/).map((line, index) => ({ line: index + 1, title: line.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').trim() })).filter(row => row.title);
  for (const row of rows) {
    row.status = row.title.length > 240 ? 'error' : seen.has(titleKey(row.title)) ? 'duplicate' : 'ready';
    row.reason = row.status === 'error' ? 'Over 240 characters' : row.status === 'duplicate' ? 'Duplicate title — skipped' : 'Ready';
    seen.add(titleKey(row.title));
  }
  const errors = [];
  if (rows.length > BULK_IDEA_LIMIT) errors.push(`Paste up to ${BULK_IDEA_LIMIT} ideas at a time.`);
  if (rows.some(row => row.status === 'error')) errors.push('Shorten titles over 240 characters before importing.');
  return { rows, titles: rows.filter(row => row.status === 'ready').map(row => row.title), skipped: rows.filter(row => row.status === 'duplicate').length, errors };
}
export function planIdeaImport(board, payload) {
  const preview = previewIdeas(payload.text, board.ideas);
  if (preview.errors.length) throw Error(preview.errors.join(' '));
  if (!preview.titles.length) throw Error('No new ideas to import. Duplicate titles are skipped.');
  if (board.ideas.length + preview.titles.length > 2000) throw Error('The board supports up to 2,000 ideas.');
  if (!formats.includes(payload.format)) throw Error('Choose a supported format.');
  let theme = board.themes.find(item => item.id === payload.themeId);
  if (payload.newThemeName != null) {
    const name = payload.newThemeName.trim();
    if (!name || name.length > 120) throw Error('Enter a theme name of 1–120 characters.');
    if (board.themes.length >= 50) throw Error('The board supports up to 50 themes.');
    if (board.themes.some(item => titleKey(item.name) === titleKey(name))) throw Error('A theme with that name already exists. Choose it from the list.');
    theme = { id: 'theme-' + crypto.randomUUID(), name, shortName: name, description: '', isDemo: false, ...colors('#799588') };
  }
  if (!theme) throw Error('Choose a theme. It may have been removed.');
  return { preview, theme, newTheme: payload.newThemeName != null };
}
export function appendIdeas(board, payload) {
  const { preview, theme, newTheme } = planIdeaImport(board, payload);
  if (newTheme) board.themes.push(theme);
  board.ideas.push(...preview.titles.map(title => ({ id: 'idea-' + crypto.randomUUID(), theme: theme.id, title, demo: '', value: '', notes: '', status: 'planned', previousStatus: 'planned', format: payload.format, selected: false, youtubeVideoId: '', isDemo: false })));
  return board;
}
