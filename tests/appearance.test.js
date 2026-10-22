import { test, expect, vi } from 'vitest';
import { effectScope } from 'vue';
import { createRepository } from '../src/services/database.js';
import { useAppearance } from '../src/composables/useAppearance.js';
test('appearance persists in Dexie, follows system changes and updates across subscriptions', async () => {
  const repo = createRepository({ name: 'appearance-' + crypto.randomUUID(), legacyStorage: null }); await repo.open();
  let listener; const media = { matches: false, addEventListener: (_, fn) => { listener = fn; }, removeEventListener: vi.fn() };
  window.matchMedia.mockReturnValueOnce(media);
  const scope = effectScope(), appearance = scope.run(() => useAppearance(repo));
  try {
    await appearance.set('dark'); expect(await repo.getSetting('appearance')).toBe('dark'); expect(document.documentElement.dataset.theme).toBe('dark');
    await appearance.set('system'); media.matches = true; listener(); expect(document.documentElement.dataset.theme).toBe('dark'); media.matches = false; listener(); expect(document.documentElement.dataset.theme).toBe('light');
    await repo.setSetting('appearance', 'dark'); await vi.waitFor(() => expect(appearance.preference.value).toBe('dark'));
  } finally { scope.stop(); await repo.db.delete(); document.documentElement.dataset.theme = 'light'; }
});
