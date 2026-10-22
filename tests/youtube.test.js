import { test, expect, vi } from 'vitest';
import { createYouTubeApi } from '../src/services/youtube-api.js';
import { channelLookup, videoId, range, fresh, SCOPES } from '../src/lib/youtube.js';
const CHANNEL = 'UC' + 'a'.repeat(22), OTHER = 'UC' + 'b'.repeat(22), VIDEO = 'demoVideo01';
function fakeApi({ mismatch = false, denied = false } = {}) {
  const fetcher = vi.fn(async (url) => {
    if (denied) return { ok: false, status: 403 };
    const u = new URL(url), channel = { id: CHANNEL, snippet: { title: 'Test channel' }, contentDetails: { relatedPlaylists: { uploads: 'test-uploads' } } }; let data;
    if (u.pathname.endsWith('/channels')) data = { items: [u.searchParams.has('mine') && mismatch ? { ...channel, id: OTHER } : channel] };
    else if (u.pathname.endsWith('/playlistItems')) data = { items: [VIDEO, 'demoVideo02'].map(videoId => ({ contentDetails: { videoId } })) };
    else if (u.pathname.endsWith('/videos')) data = { items: [{ id: VIDEO, snippet: { channelId: CHANNEL, title: 'Example', publishedAt: '2025-01-01T10:00:00Z' }, status: { privacyStatus: 'public' }, statistics: { viewCount: '123', likeCount: '4' } }, { id: 'demoVideo02', snippet: { channelId: CHANNEL, title: 'Scheduled example' }, status: { privacyStatus: 'private', publishAt: '2027-01-01T10:00:00Z' } }] };
    else if (u.pathname.endsWith('/reports')) data = { columnHeaders: [{ name: 'views' }, { name: 'likes' }], rows: [[12, 2]] };
    else throw Error('Unexpected endpoint');
    return { ok: true, json: async () => data };
  }); return { fetcher, load: createYouTubeApi(fetcher) };
}
test('channel and video parsing rejects unrelated sites', () => { expect(channelLookup('https://youtube.com/@example')).toEqual({ forHandle: '@example' }); expect(channelLookup('https://example.com/@example')).toBeNull(); expect(videoId('https://youtu.be/' + VIDEO)).toBe(VIDEO); expect(videoId('https://example.com/watch?v=' + VIDEO)).toBeNull(); });
test('public key uses a header, filters private videos and leaves missing counts unknown', async () => {
  const { load, fetcher } = fakeApi(); const key = 'synthetic-key-not-a-credential';
  const result = await load({ config: { mode: 'public', channel: '@example', days: 28 }, auth: { apiKey: key } });
  expect(result.mode).toBe('public'); expect(result.videos).toHaveLength(1); expect(result.reports[VIDEO]).toEqual({ views: 123, likes: 4, comments: null });
  for (const [url, options] of fetcher.mock.calls) { expect(url).not.toContain(key); expect(options.headers['X-Goog-Api-Key']).toBe(key); expect(options.headers.Authorization).toBeUndefined(); }
});
test('owner fetch checks channel membership, retains schedules and retrieves dated reports', async () => {
  const { load, fetcher } = fakeApi(); const result = await load({ config: { mode: 'owner', channel: '@example', days: 7 }, auth: { token: 'synthetic-token' }, ideas: [{ youtubeVideoId: VIDEO }] });
  expect(result.videos).toHaveLength(2); expect(result.videos[1].publishAt).toBe('2027-01-01T10:00:00Z'); expect(result.reports[VIDEO].views).toBe(12); expect(result.start).toBeTruthy(); expect(result.end).toBeTruthy(); expect(result).not.toHaveProperty('token');
  expect(fetcher.mock.calls.every(([, o]) => o.headers.Authorization === 'Bearer synthetic-token')).toBe(true); expect(SCOPES.every(s => s.endsWith('.readonly'))).toBe(true);
});
test('wrong signed-in channel fails before reading uploads', async () => { const { load, fetcher } = fakeApi({ mismatch: true }); await expect(load({ config: { mode: 'owner', channel: '@example' }, auth: { token: 'synthetic-token' } })).rejects.toThrow('does not match'); expect(fetcher).toHaveBeenCalledTimes(2); });
test('quota or restriction error remains actionable and contains no credential', async () => { const { load } = fakeApi({ denied: true }); await expect(load({ config: { mode: 'public', channel: '@example' }, auth: { apiKey: 'synthetic-key' } })).rejects.toThrow('restrictions and quota'); });
test('Pacific dates and thirty-day expiry', () => { expect(range(7, new Date('2025-01-10T02:00:00Z'))).toEqual({ start: '2025-01-02', end: '2025-01-08' }); const c = { fetchedAt: '2025-01-01T00:00:00Z' }; expect(fresh(c, Date.parse('2025-01-30T00:00:00Z'))).toBe(true); expect(fresh(c, Date.parse('2025-01-31T00:00:00Z'))).toBe(false); });
