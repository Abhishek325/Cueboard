import { ref, computed, onScopeDispose } from 'vue';
import { liveQuery } from 'dexie';
import { repository } from '../services/database.js';
import { createYouTubeApi } from '../services/youtube-api.js';
import { loadGoogle } from '../services/google-auth.js';
import { fresh, SCOPES, channelLookup } from '../lib/youtube.js';

export function useYoutube(ideas, repo = repository, api = createYouTubeApi()) {
  const config = ref({ mode: 'public', channel: '', clientId: '', days: 28 }), cache = ref(null), apiKey = ref(''), remember = ref(false);
  const busy = ref(false), authBusy = ref(false), message = ref('YouTube is optional. The board works without a connection.'), error = ref(false), tick = ref(Date.now()), hydrated = ref(false);
  let disposed = false;
  let token = '', expires = 0, generation = 0, controller, subscriptions = [];
  const connected = computed(() => { tick.value; return !!token && Date.now() < expires; });
  const ready = computed(() => config.value.mode === 'owner' ? connected.value : !!apiKey.value);
  const label = computed(() => busy.value ? 'YouTube: syncing...' : connected.value ? 'YouTube: connected' : cache.value ? 'YouTube: saved data' : 'YouTube setup');
  const stamp = computed(() => !cache.value ? 'No YouTube data fetched yet.' : 'Fetched ' + new Date(cache.value.fetchedAt).toLocaleString() + ' · ' + (cache.value.mode === 'public' ? 'Public lifetime totals' : cache.value.start + ' to ' + cache.value.end + ' (Pacific time)'));
  function say(text, failed = false) { message.value = text; error.value = failed; }
  function validCache(value) { return value && fresh(value) && value.mode === config.value.mode && value.channelTarget === config.value.channel && /^UC[\w-]{22}$/.test(value.channelId) && Array.isArray(value.videos) && value.videos.length <= 5000 && value.reports && typeof value.reports === 'object'; }
  function resetSession() { generation++; controller?.abort(); token = ''; expires = 0; tick.value++; authBusy.value = false; }
  async function start() {
    try {
      await repo.open();
      if (disposed) return;
      const [saved, key, cached] = await Promise.all([repo.getSetting('youtube'), repo.getApiKey(), repo.getCache()]);
      if (disposed) return;
      if (saved) config.value = { mode: saved.mode === 'owner' ? 'owner' : 'public', channel: saved.channel || '', clientId: saved.clientId || '', days: [7, 28, 90].includes(saved.days) ? saved.days : 28 };
      apiKey.value = key; remember.value = !!key;
      if (validCache(cached)) cache.value = cached; else if (cached) await repo.setCache(null);
      if (disposed) return;
      subscriptions.forEach(s => s.unsubscribe()); subscriptions = [];
      // Other tabs can change connection settings or clear cached data. Never reuse a session for a different channel.
      subscriptions.push(liveQuery(() => repo.getSetting('youtube')).subscribe(saved => { if (saved && JSON.stringify(saved) !== JSON.stringify(config.value)) { resetSession(); config.value = saved; cache.value = null; } }));
      subscriptions.push(liveQuery(() => repo.getCache()).subscribe(saved => { cache.value = validCache(saved) ? saved : null; }));
      subscriptions.push(liveQuery(() => repo.getApiKey()).subscribe(saved => { if (!saved && remember.value) apiKey.value = ''; if (saved) apiKey.value = saved; remember.value = !!saved; }));
      hydrated.value = true;
    } catch (e) { say('Could not load YouTube settings: ' + e.message, true); }
  }
  async function refresh(prepared = Promise.resolve()) {
    if (busy.value || !ready.value) return;
    const session = generation; const cfg = { ...config.value }; busy.value = true; error.value = false; controller = new AbortController();
    try {
      await prepared;
      const result = await api({ config: cfg, auth: { token, apiKey: apiKey.value }, ideas: ideas(), signal: controller.signal });
      if (session !== generation) return;
      await repo.setCache(result); if (session !== generation) return;
      cache.value = result; say('Loaded ' + result.videos.length + ' videos from ' + result.channelTitle + '. ' + (cfg.mode === 'public' ? 'Public lifetime totals only.' : 'Private reports use the selected date period.'));
    } catch (e) { if (session === generation) { if (/expired/.test(e.message)) { token = ''; expires = 0; tick.value++; } say(e.message, true); } }
    finally { busy.value = false; }
  }
  function connect(form) {
    if (busy.value || authBusy.value) return;
    if (!form.agree) return say('Review and accept the data-use notice before connecting.', true);
    const cfg = { mode: form.mode === 'owner' ? 'owner' : 'public', channel: form.channel.trim(), clientId: form.clientId.trim(), days: Number(form.days) };
    if (![7, 28, 90].includes(cfg.days)) cfg.days = 28;
    if (cfg.channel && !channelLookup(cfg.channel)) return say('Enter a channel ID, @handle or YouTube channel URL.', true);
    if (cfg.mode === 'public' && (!cfg.channel || !/^[\w-]{20,200}$/.test(form.apiKey.trim()))) return say('Enter a valid YouTube Data API key and channel.', true);
    if (cfg.mode === 'owner' && !/^[\w-]+\.apps\.googleusercontent\.com$/.test(cfg.clientId)) return say('Enter your OAuth web client ID, never a client secret.', true);
    resetSession(); const session = generation;
    const different = config.value.mode !== cfg.mode || config.value.channel !== cfg.channel || config.value.clientId !== cfg.clientId;
    config.value = cfg; apiKey.value = cfg.mode === 'public' ? form.apiKey.trim() : ''; remember.value = cfg.mode === 'public' && !!form.remember;
    if (different) cache.value = null;
    // Start persistence without awaiting so the OAuth popup still runs inside the click gesture.
    const prepared = repo.db.transaction('rw', repo.db.settings, repo.db.credentials, repo.db.youtubeCache, async () => { await repo.setSetting('youtube', cfg); await repo.setApiKey(remember.value ? apiKey.value : ''); if (different) await repo.setCache(null); });
    prepared.catch(e => say('Could not save connection settings. ' + e.message, true));
    if (cfg.mode === 'public') { refresh(prepared); return; }
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth) { loadGoogle().then(() => say('Google sign-in is ready. Press Connect Google.')).catch(e => say(e.message, true)); say('Loading Google sign-in...'); return; }
    authBusy.value = true;
    const client = oauth.initTokenClient({ client_id: cfg.clientId, scope: SCOPES.join(' '), include_granted_scopes: false,
      callback(result) { if (session !== generation) return; authBusy.value = false;
        if (result.error || !oauth.hasGrantedAllScopes(result, ...SCOPES)) return say('Both read permissions are required. No reports were fetched.', true);
        token = result.access_token; expires = Date.now() + Math.max(0, Number(result.expires_in) - 60) * 1000; tick.value++; refresh(prepared);
      }, error_callback() { if (session !== generation) return; authBusy.value = false; say('Google sign-in closed or was blocked. Try again.', true); },
    });
    try { client.requestAccessToken({ prompt: 'select_account' }); } catch { authBusy.value = false; say('Allow the Google sign-in popup and try again.', true); }
  }
  async function forget() { apiKey.value = ''; remember.value = false; try { await repo.setApiKey(''); say('API key forgotten on this device.'); } catch (e) { say('Could not remove the saved key: ' + e.message, true); } }
  async function disconnect() { resetSession(); await forget(); say('Disconnected. Dated saved YouTube data remains.'); }
  async function clear() { try { await repo.setCache(null); cache.value = null; say('Saved YouTube data removed.'); } catch (e) { say('Could not clear saved data: ' + e.message, true); } }
  async function revoke() { if (!connected.value) return; const current = token; resetSession(); await clear(); window.google.accounts.oauth2.revoke(current, result => say(result.successful ? 'Google access revoked.' : 'Confirm removal in Google Account connections.', !result.successful)); }
  const timer = setInterval(() => { tick.value++; if (token && !connected.value) { token = ''; say('Google sign-in expired. Reconnect to refresh.'); } if (cache.value && !fresh(cache.value)) clear(); }, 30000);
  onScopeDispose(() => { disposed = true; resetSession(); clearInterval(timer); subscriptions.forEach(s => s.unsubscribe()); });
  return { config, cache, apiKey, remember, busy, authBusy, message, error, connected, ready, label, stamp, hydrated, start, refresh, connect, forget, disconnect, clear, revoke };
}
