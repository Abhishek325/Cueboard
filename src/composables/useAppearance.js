import { ref, onScopeDispose } from 'vue';
import { liveQuery } from 'dexie';
import { repository } from '../services/database.js';
export function useAppearance(repo = repository) {
  const preference = ref('system');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() { const value = preference.value === 'system' ? (media.matches ? 'dark' : 'light') : preference.value; document.documentElement.dataset.theme = value; document.documentElement.style.colorScheme = value; }
  apply(); media.addEventListener('change', apply);
  const sub = liveQuery(() => repo.getSetting('appearance')).subscribe(value => { preference.value = ['light', 'dark'].includes(value) ? value : 'system'; apply(); });
  async function set(value) { if (!['light', 'dark', 'system'].includes(value)) return; await repo.setSetting('appearance', value); preference.value = value; apply(); }
  onScopeDispose(() => { sub.unsubscribe(); media.removeEventListener('change', apply); });
  return { preference, set };
}
