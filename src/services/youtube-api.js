import { videoId, channelLookup, metadata, range, report, METRICS } from '../lib/youtube.js';

export function createYouTubeApi(fetcher = globalThis.fetch) {
  return async function load({ config, auth, ideas = [], signal }) {
    const owner = config.mode === 'owner';
    async function request(base, params) {
      let response;
      try {
        response = await fetcher(base + '?' + new URLSearchParams(params), {
          headers: owner ? { Authorization: 'Bearer ' + auth.token } : { 'X-Goog-Api-Key': auth.apiKey }, credentials: 'omit',
          referrerPolicy: owner ? 'no-referrer' : 'strict-origin-when-cross-origin', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
        });
      } catch (e) { if (signal?.aborted) throw Error('Connection changed.'); throw Error('Could not reach Google. Saved data was kept.'); }
      if (!response.ok) {
        if (response.status === 401) throw Error('Google sign-in expired. Connect Google again.');
        if (response.status === 403) throw Error('Request denied. Check API activation, permissions, website/API restrictions and quota.');
        if (response.status === 400) throw Error('Google rejected the request. Check your channel and connection settings.');
        throw Error('Google is unavailable. Try again later.');
      }
      return response.json();
    }
    const base = 'https://www.googleapis.com/youtube/v3/';
    const query = channelLookup(config.channel);
    if (!owner && (!query || !auth.apiKey)) throw Error('Enter an API key and a valid channel.');
    if (owner && !auth.token) throw Error('Connect Google first.');
    let expectedData, expected = '';
    if (query) { expectedData = await request(base + 'channels', { part: 'snippet,contentDetails', ...query }); expected = expectedData.items?.[0]?.id || ''; if (!expected) throw Error('Channel not found. Check its ID or @handle.'); }
    const mine = owner ? await request(base + 'channels', { part: 'snippet,contentDetails', mine: 'true' }) : null;
    const channel = owner ? (expected ? mine.items?.find(c => c.id === expected) : mine.items?.length === 1 ? mine.items[0] : null) : expectedData.items[0];
    if (!channel || !/^UC[\w-]{22}$/.test(channel.id)) throw Error('The Google selection does not match this channel. Select its owner/brand account, or specify the channel when multiple channels are available.');
    let ids = [], page = '', pages = 0;
    do {
      const list = await request(base + 'playlistItems', { part: 'contentDetails', playlistId: channel.contentDetails.relatedPlaylists.uploads, maxResults: '50', ...(page ? { pageToken: page } : {}) });
      for (const item of list.items || []) if (videoId(item.contentDetails?.videoId)) ids.push(item.contentDetails.videoId);
      page = list.nextPageToken || ''; pages++;
      if (ids.length > 5000 || (pages >= 100 && page)) throw Error('This channel exceeds the 5,000-upload limit. No partial data was saved.');
    } while (page);
    ids = [...new Set(ids)]; const videos = [], reports = {};
    for (let n = 0; n < ids.length; n += 50) {
      const data = await request(base + 'videos', { part: owner ? 'snippet,status' : 'snippet,status,statistics', id: ids.slice(n, n + 50).join(',') });
      for (const item of data.items || []) {
        const value = metadata(item, channel.id, config.mode); if (!value) continue; videos.push(value);
        if (!owner) {
          reports[value.id] = {};
          for (const [from, to] of [['viewCount', 'views'], ['likeCount', 'likes'], ['commentCount', 'comments']]) {
            const raw = item.statistics?.[from]; reports[value.id][to] = raw !== undefined && raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : null;
          }
        }
      }
    }
    const dates = range(config.days);
    if (owner) {
      const available = new Set(videos.filter(v => v.privacyStatus === 'public').map(v => v.id));
      for (const id of new Set(ideas.map(i => videoId(i.youtubeVideoId)).filter(Boolean))) {
        if (!available.has(id)) continue;
        const data = await request('https://youtubeanalytics.googleapis.com/v2/reports', { ids: 'channel==' + channel.id, startDate: dates.start, endDate: dates.end, metrics: METRICS.join(','), filters: 'video==' + id });
        const parsed = report(data); if (parsed) reports[id] = parsed;
      }
    }
    return { mode: config.mode, channelTarget: config.channel, channelId: channel.id, channelTitle: String(channel.snippet?.title || 'YouTube channel'), fetchedAt: new Date().toISOString(), videos, reports, ...(owner ? { days: config.days, ...dates } : {}) };
  };
}
