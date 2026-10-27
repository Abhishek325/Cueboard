import { ref, computed, onScopeDispose } from 'vue';
import { liveQuery } from 'dexie';
import { repository } from '../services/database.js';
import { normalize, removeDemo, deleteTheme, colors } from '../lib/board.js';
import { appendIdeas } from '../lib/bulk-ideas.js';
import { reorderTheme, reorderIdea } from '../lib/reorder.js';

export function useBoard(repo = repository) {
  const board = ref({ schemaVersion: 1, themes: [], ideas: [] });
  const loading = ref(true), busy = ref(false), error = ref(''), message = ref(''), undo = ref(null);
  let subscription, timer, disposed = false;
  function notify(text) { message.value = text; clearTimeout(timer); timer = setTimeout(() => { message.value = ''; undo.value = null; }, 9000); }
  async function start() {
    loading.value = true; error.value = '';
    try {
      await repo.open(); const value = await repo.readBoard(); if (disposed) return; board.value = value;
      subscription?.unsubscribe();
      subscription = liveQuery(() => repo.readBoard()).subscribe({ next: value => { board.value = value; }, error: e => { error.value = 'Could not read IndexedDB: ' + e.message; } });
    } catch (e) { error.value = e.message || 'IndexedDB is unavailable. Enable site storage and retry.'; }
    finally { loading.value = false; }
  }
  async function change(transform, text) {
    if (busy.value) return false;
    busy.value = true;
    try {
      const result = await repo.update(transform); board.value = result.board;
      undo.value = () => repo.update(() => result.before, result.revision);
      notify(text); error.value = ''; return true;
    } catch (e) { error.value = 'Changes were not saved. ' + e.message; return false; }
    finally { busy.value = false; }
  }
  function uid(prefix) { return prefix + '-' + crypto.randomUUID(); }
  async function saveTheme(form) {
    return change(b => {
      let theme = b.themes.find(t => t.id === form.id);
      if (form.id && !theme) throw Error('That theme was removed.');
      if (!theme) { if (b.themes.length >= 50) throw Error('The board supports up to 50 themes.'); theme = { id: uid('theme') }; b.themes.push(theme); }
      Object.assign(theme, { name: form.name, description: form.description, isDemo: false }, colors(form.color)); return b;
    }, 'Theme saved.');
  }
  async function saveIdea(form) {
    return change(b => {
      let idea = b.ideas.find(i => i.id === form.id);
      if (form.id && !idea) throw Error('That idea was removed.');
      if (!idea) { if (b.ideas.length >= 2000) throw Error('The board supports up to 2,000 ideas.'); idea = { id: uid('idea'), status: 'planned', previousStatus: 'planned' }; b.ideas.push(idea); }
      if (form.status === 'done' && idea.status !== 'done') idea.previousStatus = idea.status;
      Object.assign(idea, form, { id: idea.id, isDemo: false }); return b;
    }, 'Idea saved.');
  }
  async function undoLast() {
    if (!undo.value || busy.value) return;
    busy.value = true;
    try { const result = await undo.value(); board.value = result.board; undo.value = null; notify('Change undone.'); }
    catch (e) { undo.value = null; notify(e.message); }
    finally { busy.value = false; }
  }
  onScopeDispose(() => { disposed = true; subscription?.unsubscribe(); clearTimeout(timer); });
  return { board, loading, busy, error, message, undo, start, notify, saveTheme, saveIdea, undoLast,
    importIdeas: payload => change(b => appendIdeas(b, payload), 'Ideas imported.'),
    reorderTheme: (id, targetId, after) => change(b => reorderTheme(b, id, targetId, after), 'Theme order saved.'),
    reorderIdea: (id, targetId, after) => change(b => reorderIdea(b, id, targetId, after), 'Idea order saved.'),
    hasDemo: computed(() => board.value.themes.some(t => t.isDemo) || board.value.ideas.some(i => i.isDemo)),
    removeDemo: () => change(removeDemo, 'Demo data removed.'),
    deleteTheme: id => change(b => deleteTheme(b, id), 'Theme deleted.'),
    deleteIdea: id => change(b => { b.ideas = b.ideas.filter(i => i.id !== id); return b; }, 'Idea deleted.'),
    restore: data => change(() => normalize(data), 'Board restored.'),
    toggle: id => change(b => { const i = b.ideas.find(i => i.id === id); if (!i) throw Error('That idea was removed.'); if (i.status === 'done') i.status = i.previousStatus === 'progress' ? 'progress' : 'planned'; else { i.previousStatus = i.status; i.status = 'done'; } return b; }, 'Idea status updated.'),
  };
}
