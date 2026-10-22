import { test, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import BoardView from '../src/views/BoardView.vue';
import IdeaEditor from '../src/components/IdeaEditor.vue';
import ThemeEditor from '../src/components/ThemeEditor.vue';
import PostingCalendar from '../src/components/PostingCalendar.vue';
import { repository } from '../src/services/database.js';

vi.mock('../src/services/google-auth.js', () => ({ loadGoogle: vi.fn(() => Promise.resolve()) }));
function button(wrapper, text) { const b = wrapper.findAll('button').find(b => b.text() === text); if (!b) throw Error('Button not found: ' + text); return b; }
test('Vue board creates content, removes only samples, persists progress and supports Undo', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }, { path: '/privacy', component: { template: '<div />' } }] });
  const wrapper = mount(BoardView, { attachTo: document.body, global: { plugins: [router], provide: { appearance: { preference: ref('system'), set: vi.fn() } } } });
  try {
    await vi.waitFor(() => expect(wrapper.text()).toContain('Sample: teach one useful shortcut'));
    await wrapper.get('button[aria-label="New theme"]').trigger('click'); await wrapper.get('#theme-name').setValue('My custom theme'); await wrapper.findComponent(ThemeEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('My custom theme'));
    await wrapper.get('button[aria-label="Add idea to My custom theme"]').trigger('click');
    await wrapper.get('#idea-title').setValue('An original idea'); await wrapper.get('#idea-demo').setValue('Show a real demonstration'); await wrapper.get('#idea-status').setValue('progress'); await wrapper.findComponent(IdeaEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-title').some(x => x.text() === 'An original idea')).toBe(true));
    await button(wrapper, 'Remove demo data').trigger('click'); await wrapper.get('dialog[aria-label="Remove demo data"] .btn-primary').trigger('click');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-card')).toHaveLength(1)); expect(wrapper.find('.idea-card').attributes('data-status')).toBe('progress');
    expect((await repository.readBoard()).ideas[0].title).toBe('An original idea'); expect(wrapper.text()).not.toContain('Sample:');
    await wrapper.get('button[aria-label="Mark complete: An original idea"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.find('.done-grid .idea-card').exists()).toBe(true));
    await button(wrapper, 'Undo').trigger('click'); await vi.waitFor(() => expect(wrapper.find('.active-grid .idea-card').attributes('data-status')).toBe('progress'));
    await button(wrapper, 'YouTube setup').trigger('click'); expect(wrapper.get('#yt-api-key').attributes('type')).toBe('password');
    await wrapper.get('#yt-mode').setValue('owner'); expect(wrapper.find('#yt-client').exists()).toBe(true); expect(wrapper.find('#yt-api-key').exists()).toBe(false);
    await wrapper.get('dialog[aria-label="YouTube setup"] button[aria-label="Close dialog"]').trigger('click');
    await wrapper.get('button[aria-label="Edit theme My custom theme"]').trigger('click'); await button(wrapper.findComponent(ThemeEditor), 'Delete theme').trigger('click'); await wrapper.get('dialog[aria-label="Delete theme"] .btn-primary').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Your next idea starts here.')); expect((await repository.readBoard()).themes).toHaveLength(0);
  } finally { wrapper.unmount(); await flushPromises(); await repository.db.delete(); document.body.innerHTML = ''; }
});
test('calendar renders posted ticks and scheduled clocks on the same date, and navigates months', async () => {
  const date = new Date(); date.setHours(0, 0, 0, 0);
  const cache = { videos: [{ id: 'demoVideo01', title: 'Published example', privacyStatus: 'public', publishedAt: date.toISOString() }, { id: 'demoVideo02', title: 'Scheduled example', privacyStatus: 'private', publishAt: date.toISOString() }] };
  const wrapper = mount(PostingCalendar, { props: { cache } });
  try { expect(wrapper.find('.has-post.has-scheduled').exists()).toBe(true); expect(wrapper.find('.calendar-clock').exists()).toBe(true); const before = wrapper.find('.calendar-nav').text(); await wrapper.get('[aria-label="Previous month"]').trigger('click'); expect(wrapper.find('.calendar-nav').text()).not.toBe(before); } finally { wrapper.unmount(); }
});
