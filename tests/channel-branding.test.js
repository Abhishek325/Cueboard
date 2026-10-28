import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelArtwork from '../src/components/ChannelArtwork.vue';
import ProjectHeading from '../src/components/ProjectHeading.vue';
import { channelImageUrl, channelBranding } from '../src/lib/channel-branding.js';

const cache = { channelId: 'channel-one', channelTitle: 'Example channel', channelLogoUrl: 'https://yt3.googleusercontent.com/logo-one', channelBannerUrl: 'https://yt3.ggpht.com/banner-one' };
test('branding handles absent fields, chooses a usable logo and rejects unsafe image origins', () => {
  expect(channelBranding({})).toEqual({ channelLogoUrl: '', channelBannerUrl: '' });
  expect(channelBranding({ snippet: { thumbnails: { high: { url: 'http://yt3.ggpht.com/insecure' }, default: { url: cache.channelLogoUrl } } } }).channelLogoUrl).toBe(cache.channelLogoUrl);
  for (const url of ['javascript:alert(1)', 'https://ggpht.com.evil.example/image', 'https://example.com/image', 'https://user:password@yt3.ggpht.com/image']) expect(channelImageUrl(url)).toBe('');
});
test('banner disappears on load failure and can show fresh art for another project', async () => {
  const wrapper = mount(ChannelArtwork, { props: { cache } });
  expect(wrapper.get('img').attributes('alt')).toBe('Example channel banner');
  expect(wrapper.get('img').attributes('src')).toBe(cache.channelBannerUrl);
  await wrapper.get('img').trigger('error');
  expect(wrapper.find('img').exists()).toBe(false);
  await wrapper.setProps({ cache: { ...cache, channelId: 'channel-two', channelBannerUrl: 'https://yt3.ggpht.com/banner-two' } });
  expect(wrapper.get('img').attributes('src')).toContain('banner-two');
  await wrapper.setProps({ cache: null });
  expect(wrapper.find('.channel-banner').exists()).toBe(false);
  wrapper.unmount();
});
test('channel avatar sits before the editable project heading without changing its name', async () => {
  const wrapper = mount(ProjectHeading, { props: { name: 'My creator project', channel: cache } });
  expect(wrapper.get('.project-heading-row').element.firstElementChild.className).toBe('channel-avatar');
  expect(wrapper.get('h1').text()).toBe('My creator project');
  expect(wrapper.get('img').attributes('src')).toBe(cache.channelLogoUrl);
  await wrapper.setProps({ channel: { channelTitle: 'Old cache without art' } });
  expect(wrapper.find('.channel-avatar').exists()).toBe(false);
  expect(wrapper.get('h1').text()).toBe('My creator project');
  wrapper.unmount();
});
