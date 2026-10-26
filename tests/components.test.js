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

test('board prioritizes ongoing work and expands completed previews without hiding search results or changing saved order', async () => {
  const idea = (id, theme, status) => ({ id, theme, status, title: id, format: 'Reel + Short' });
  const data = { schemaVersion: 1, themes: [{ id: 'build', name: 'Build' }, { id: 'learn', name: 'Learn' }], ideas: [
    idea('Planned-first', 'build', 'planned'), idea('Ongoing-first', 'build', 'progress'),
    idea('Planned-second', 'build', 'planned'), idea('Ongoing-second', 'build', 'progress'),
    ...[1, 2, 3, 4].map(n => idea('Finished-' + n, 'build', 'done')),
    idea('Learn-planned', 'learn', 'planned'), idea('Learn-ongoing', 'learn', 'progress'), idea('Learn-finished', 'learn', 'done'),
  ] };
  await repository.db.open();
  await repository.update(() => data);
  const wrapper = mount(BoardView, { attachTo: document.body, global: { provide: { appearance: { preference: ref('system'), set: vi.fn() } } } });
  const titles = selector => wrapper.findAll(selector + ' .idea-title').map(card => card.text());
  try {
    await vi.waitFor(() => expect(wrapper.findAll('.active-grid .idea-card')).toHaveLength(6));
    expect(titles('.active-grid .column:first-child')).toEqual(['Ongoing-first', 'Ongoing-second', 'Planned-first', 'Planned-second']);
    expect(titles('.active-grid .column:last-child')).toEqual(['Learn-ongoing', 'Learn-planned']);
    expect(titles('.done-grid')).toEqual(['Finished-1', 'Finished-2', 'Learn-finished']);
    expect(wrapper.findAll('.is-completed-preview')).toHaveLength(1);
    expect(wrapper.get('.is-completed-preview .idea-title').text()).toBe('Finished-2');
    expect(wrapper.get('.completed-more-button').text()).toContain('2 more');
    expect(wrapper.get('.completed-more-button').attributes('aria-expanded')).toBe('false');
    await wrapper.get('.completed-more-button').trigger('click');
    expect(titles('.done-grid')).toEqual(['Finished-1', 'Finished-2', 'Finished-3', 'Finished-4', 'Learn-finished']);
    expect(wrapper.find('.is-completed-preview').exists()).toBe(false);
    expect(wrapper.get('.completed-more-button').attributes('aria-expanded')).toBe('true');
    await wrapper.get('.completed-more-button').trigger('click');
    expect(wrapper.findAll('.done-grid .idea-card')).toHaveLength(3);

    await wrapper.get('input[type="search"]').setValue('Finished-4');
    expect(titles('.done-grid')).toEqual(['Finished-4']);
    expect(wrapper.find('.is-completed-preview').exists()).toBe(false);
    expect(wrapper.find('.completed-more-button').exists()).toBe(false);
    await wrapper.get('input[type="search"]').setValue('');
    expect(wrapper.findAll('.done-grid .idea-card')).toHaveLength(3);
    await wrapper.get('.theme-nav button:last-child').trigger('click');
    expect(titles('.done-grid')).toEqual(['Learn-finished']);
    expect(wrapper.find('.completed-more-button').exists()).toBe(false);
    await wrapper.get('[aria-label="Show all themes"]').trigger('click');
    expect(wrapper.find('.completed-more-button').exists()).toBe(true);
    expect((await repository.readBoard()).ideas.map(i => i.id)).toEqual(data.ideas.map(i => i.id));

    await wrapper.get('[aria-label="Open idea: Planned-second"]').trigger('click');
    await wrapper.get('#idea-status').setValue('progress');
    await wrapper.findComponent(IdeaEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(titles('.active-grid .column:first-child')).toEqual(['Ongoing-first', 'Planned-second', 'Ongoing-second', 'Planned-first']));
    await button(wrapper, 'Undo').trigger('click');
    await vi.waitFor(() => expect(titles('.active-grid .column:first-child')).toEqual(['Ongoing-first', 'Ongoing-second', 'Planned-first', 'Planned-second']));
  } finally { wrapper.unmount(); await flushPromises(); await repository.db.delete(); document.body.innerHTML = ''; }
});
