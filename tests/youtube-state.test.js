import { test, expect, vi, afterEach } from 'vitest';
import { effectScope } from 'vue';
import { createRepository } from '../src/services/database.js';
import { useYoutube } from '../src/composables/useYoutube.js';
const cleanups = [];
const CHANNEL = 'UC' + 'a'.repeat(22);
function snapshot(config) { return { mode: config.mode, channelTarget: config.channel, channelId: CHANNEL, channelTitle: 'Synthetic channel', fetchedAt: new Date().toISOString(), videos: [], reports: {} }; }
async function harness(api = vi.fn(async ({ config }) => snapshot(config))) {
  const repo = createRepository({ name: 'state-test-' + crypto.randomUUID(), legacyStorage: null }); await repo.open();
  const scope = effectScope(), y = scope.run(() => useYoutube(() => [], repo, api)); await y.start(); cleanups.push(async () => { scope.stop(); await repo.db.delete(); }); return { y, repo, api };
}
const form = { mode: 'public', channel: '@example', clientId: '', days: 28, apiKey: 'synthetic-session-key-not-real', remember: false, agree: true };
afterEach(async () => { for (const fn of cleanups.splice(0)) await fn(); delete window.google; });
test('session key stays out of IndexedDB and disconnect prevents late sync writes', async () => {
  let finish; const { y, repo } = await harness(() => new Promise(resolve => { finish = resolve; }));
  y.connect(form); await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  expect(await repo.getApiKey()).toBe(''); await y.disconnect(); finish(snapshot(form)); await vi.waitFor(() => expect(y.busy.value).toBe(false)); expect(await repo.getCache()).toBeNull();
});
test('Remember stores the API key in Dexie; Forget deletes it and leaves content intact', async () => {
  const { y, repo } = await harness(); y.connect({ ...form, remember: true }); await vi.waitFor(() => expect(y.cache.value).not.toBeNull()); expect(await repo.getApiKey()).toBe(form.apiKey); await y.forget(); expect(await repo.getApiKey()).toBe(''); expect(y.ready.value).toBe(false); expect((await repo.readBoard()).ideas).toHaveLength(3);
});
test('Google connection requests only the two read scopes and never persists its token', async () => {
  const tokenClient = vi.fn(options => ({ requestAccessToken() { options.callback({ access_token: 'synthetic-oauth-token', expires_in: 3600 }); } }));
  window.google = { accounts: { oauth2: { initTokenClient: tokenClient, hasGrantedAllScopes: () => true } } };
  const { y, repo, api } = await harness(); y.connect({ ...form, mode: 'owner', clientId: 'test-client.apps.googleusercontent.com' });
  await vi.waitFor(() => expect(y.cache.value).not.toBeNull()); expect(y.connected.value).toBe(true); expect(tokenClient.mock.calls[0][0].scope).toContain('youtube.readonly'); expect(tokenClient.mock.calls[0][0].scope).toContain('yt-analytics.readonly'); expect(api.mock.calls[0][0].auth.token).toBe('synthetic-oauth-token');
  const stored = await Promise.all(repo.db.tables.map(table => table.toArray())); expect(JSON.stringify(stored)).not.toContain('synthetic-oauth-token');
});
