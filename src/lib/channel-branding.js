export function channelImageUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    const host = url.hostname;
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      ['googleusercontent.com', 'ggpht.com', 'ytimg.com'].some(domain => host === domain || host.endsWith('.' + domain)) ? url.href : '';
  } catch { return ''; }
}

export function channelBranding(channel) {
  const thumbnails = channel?.snippet?.thumbnails;
  return {
    channelLogoUrl: ['high', 'medium', 'default'].map(size => channelImageUrl(thumbnails?.[size]?.url)).find(Boolean) || '',
    channelBannerUrl: channelImageUrl(channel?.brandingSettings?.image?.bannerExternalUrl)
  };
}
