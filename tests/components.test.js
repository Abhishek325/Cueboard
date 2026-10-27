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
    await vi.waitFor(() => expect(wrapper.text()).toContain('Record a clean voiceover with your phone'));
    expect(wrapper.findAll('.active-grid [data-status="progress"]')).toHaveLength(1);
    const scrollArea = wrapper.get('[aria-label="Scrollable theme board"]');
    expect(scrollArea.attributes('tabindex')).toBe('0');
    expect(scrollArea.findAll('.active-grid > .theme-section')).toHaveLength(4);
    expect(scrollArea.find('.toolbar').exists()).toBe(false);
    expect(scrollArea.find('.sidebar').exists()).toBe(false);
    expect(scrollArea.find('.page-heading').exists()).toBe(false);
    expect(scrollArea.find('.summary-line').exists()).toBe(false);
    expect(scrollArea.find('.done-grid').exists()).toBe(true);

    expect(wrapper.get('.topbar-actions [data-about-open]').text()).toBe('About Slateory');
    expect(wrapper.find('.sidebar .theme-nav').exists()).toBe(false);
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    await wrapper.get('button[aria-label="New theme"]').trigger('click'); await wrapper.get('#theme-name').setValue('My custom theme'); await wrapper.findComponent(ThemeEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.text()).toContain('My custom theme'));
    await wrapper.get('button[aria-label="Add idea to My custom theme"]').trigger('click');
    await wrapper.get('#idea-title').setValue('An original idea'); await wrapper.get('#idea-demo').setValue('Show a real demonstration'); await wrapper.get('#idea-status').setValue('progress'); await wrapper.findComponent(IdeaEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-title').some(x => x.text() === 'An original idea')).toBe(true));
    expect(wrapper.find('.board-footnote').text()).not.toContain('Remove demo data');
    expect(wrapper.findAll('.theme-name')).toHaveLength(5);
    await button(wrapper, 'Start empty').trigger('click'); await wrapper.get('dialog[aria-label="Remove demo data"] .btn-primary').trigger('click');
    await vi.waitFor(() => expect(wrapper.findAll('.idea-card')).toHaveLength(1)); expect(wrapper.find('.idea-card').attributes('data-status')).toBe('progress');
    expect((await repository.readBoard()).ideas[0].title).toBe('An original idea'); expect(wrapper.text()).not.toContain('Sample:');
    await wrapper.get('button[aria-label="Mark complete: An original idea"]').trigger('click');
    await vi.waitFor(() => expect(wrapper.find('.done-grid .idea-card').exists()).toBe(true));
    await button(wrapper, 'Undo').trigger('click'); await vi.waitFor(() => expect(wrapper.find('.active-grid .idea-card').attributes('data-status')).toBe('progress'));
    await wrapper.get('[aria-label="YouTube setup"]').trigger('click'); expect(wrapper.get('#yt-api-key').attributes('type')).toBe('password');
    await wrapper.get('#yt-mode').setValue('owner'); expect(wrapper.find('#yt-client').exists()).toBe(true); expect(wrapper.find('#yt-api-key').exists()).toBe(false);
    await wrapper.get('dialog[aria-label="YouTube setup"] button[aria-label="Close dialog"]').trigger('click');
    await wrapper.get('button[aria-label="Edit theme My custom theme"]').trigger('click'); await button(wrapper.findComponent(ThemeEditor), 'Delete theme').trigger('click'); await wrapper.get('dialog[aria-label="Delete theme"] .btn-primary').trigger('click');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Your next idea starts here.')); expect((await repository.readBoard()).themes).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Personal workspace');
    expect(wrapper.text()).not.toContain('Saved in this browser · IndexedDB');
    expect(wrapper.findAll('.heading-actions button').some(b => b.text() === 'Export backup')).toBe(false);
    expect(wrapper.findComponent(PostingCalendar).exists()).toBe(false);
    expect(wrapper.findAll('.heading-actions button').some(b => b.text().includes('YouTube'))).toBe(false);
    expect(wrapper.get('.empty-board-actions .btn-primary').text()).toBe('Create a theme');
    expect(wrapper.get('.empty-board-actions .btn-quiet').text()).toBe('Restore backup');
    const input = wrapper.get('input[type="file"]');
    const picker = vi.spyOn(input.element, 'click').mockImplementation(() => {});
    await button(wrapper, 'Restore backup').trigger('click');
    expect(picker).toHaveBeenCalledOnce(); picker.mockRestore();
    const backup = { schemaVersion: 1, themes: [{ id: 'restored', name: 'Restored theme' }], ideas: [] };
    Object.defineProperty(input.element, 'files', { configurable: true, value: [{ size: 200, text: async () => JSON.stringify(backup) }] });
    await input.trigger('change'); await flushPromises();
    expect(wrapper.get('dialog[aria-label="Restore board backup"]').text()).toContain('0 ideas across 1 themes');
    await wrapper.get('dialog[aria-label="Restore board backup"] .btn-primary').trigger('click');
    await vi.waitFor(() => expect(wrapper.findAll('.theme-name').map(t => t.text())).toEqual(['Restored theme']));
    expect(wrapper.findComponent(PostingCalendar).exists()).toBe(false);
    expect(wrapper.findAll('.heading-actions button').some(b => b.text().includes('YouTube'))).toBe(false);
    expect(wrapper.find('.empty-board-actions').exists()).toBe(true);
    expect(wrapper.findAll('.heading-actions button').some(b => b.text() === 'Export backup')).toBe(true);
    await button(wrapper, 'New idea').trigger('click');
    await wrapper.get('#idea-title').setValue('First idea after restoring');
    await wrapper.findComponent(IdeaEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(wrapper.findComponent(PostingCalendar).exists()).toBe(true));
    expect(wrapper.find('.empty-board-actions').exists()).toBe(false);
    expect(wrapper.findAll('.heading-actions button').some(b => b.text().includes('YouTube'))).toBe(false);
    expect(wrapper.get('.posting-calendar [aria-label="YouTube setup"]').exists()).toBe(true);
    expect(wrapper.get('.group-label').text()).toBe('Grouped by theme');
    expect(wrapper.get('.group-label').find('svg').exists()).toBe(false);
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
    expect(titles('.active-grid [data-theme="build"]')).toEqual(['Ongoing-first', 'Ongoing-second', 'Planned-first', 'Planned-second']);
    expect(titles('.active-grid [data-theme="learn"]')).toEqual(['Learn-ongoing', 'Learn-planned']);
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
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    await wrapper.get('.theme-filter-options label:first-child input').setValue(false);
    expect(titles('.done-grid')).toEqual(['Learn-finished']);
    expect(wrapper.find('.completed-more-button').exists()).toBe(false);
    await wrapper.get('[aria-label="Show all themes"]').trigger('click');
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    expect(wrapper.find('.completed-more-button').exists()).toBe(true);
    expect((await repository.readBoard()).ideas.map(i => i.id)).toEqual(data.ideas.map(i => i.id));

    await wrapper.get('[aria-label="Open idea: Planned-second"]').trigger('click');
    await wrapper.get('#idea-status').setValue('progress');
    await wrapper.findComponent(IdeaEditor).get('form').trigger('submit');
    await vi.waitFor(() => expect(titles('.active-grid [data-theme="build"]')).toEqual(['Ongoing-first', 'Planned-second', 'Ongoing-second', 'Planned-first']));
    await button(wrapper, 'Undo').trigger('click');
    await vi.waitFor(() => expect(titles('.active-grid [data-theme="build"]')).toEqual(['Ongoing-first', 'Ongoing-second', 'Planned-first', 'Planned-second']));
  } finally { wrapper.unmount(); await flushPromises(); await repository.db.delete(); document.body.innerHTML = ''; }
});

test('drag and keyboard reorders persist themes and ideas, support Undo, and survive remount', async () => {
  const makeIdea = (id, theme = 'a', status = 'planned') => ({ id, theme, status, title: id, format: 'Reel + Short' });
  const data = { schemaVersion: 1, themes: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }], ideas: [makeIdea('First'), makeIdea('Second'), makeIdea('Third'), makeIdea('Pinned', 'a', 'progress'), makeIdea('Elsewhere', 'b'), makeIdea('Done-first', 'a', 'done'), makeIdea('Done-second', 'a', 'done'), makeIdea('Done-third', 'a', 'done')] };
  await repository.db.open(); await repository.update(() => data);
  const options = { attachTo: document.body, global: { provide: { appearance: { preference: ref('system'), set: vi.fn() } } } };
  let wrapper = mount(BoardView, options);
  const themeOrder = () => wrapper.findAll('.active-grid > .theme-section').map(el => el.attributes('data-theme'));
  const ideaOrder = () => wrapper.findAll('.active-grid [data-theme="a"] .idea-title').map(el => el.text());
  const card = id => wrapper.get('[data-idea-id="' + id + '"]');
  const transfer = { effectAllowed: '', dropEffect: '', setData: vi.fn() };
  try {
    await vi.waitFor(() => expect(themeOrder()).toEqual(['a', 'b', 'c']));
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    await wrapper.get('[aria-label="Clear theme selection"]').trigger('click');
    expect(themeOrder()).toEqual([]);
    expect(wrapper.get('.empty-filter').text()).toContain('No themes selected.');
    await wrapper.findAll('.theme-filter-options input')[0].setValue(true);
    expect(themeOrder()).toEqual(['a']);
    await wrapper.findAll('.theme-filter-options input')[2].setValue(true);
    expect(themeOrder()).toEqual(['a', 'c']);
    expect((await repository.readBoard()).themes.map(t => t.id)).toEqual(['a', 'b', 'c']);
    await wrapper.get('.theme-filter-panel [aria-label="Show all themes"]').trigger('click');
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    expect(themeOrder()).toEqual(['a', 'b', 'c']);
    await wrapper.get('[aria-label="Reorder theme: Gamma"]').trigger('dragstart', { dataTransfer: transfer });
    await wrapper.get('.active-grid [data-theme="a"]').trigger('dragover', { clientX: -1, dataTransfer: transfer });
    expect(wrapper.get('.active-grid [data-theme="a"]').classes()).toContain('drop-before');
    await wrapper.get('.active-grid [data-theme="a"]').trigger('drop', { dataTransfer: transfer });
    await vi.waitFor(() => expect(themeOrder()).toEqual(['c', 'a', 'b']));
    expect((await repository.readBoard()).themes.map(t => t.id)).toEqual(['c', 'a', 'b']);
    await button(wrapper, 'Undo').trigger('click');
    await vi.waitFor(() => expect(themeOrder()).toEqual(['a', 'b', 'c']));
    await wrapper.get('[aria-label="Reorder theme: Gamma"]').trigger('keydown', { key: 'ArrowLeft' });
    await vi.waitFor(() => expect(themeOrder()).toEqual(['a', 'c', 'b']));

    await card('Third').get('.reorder-handle').trigger('dragstart', { dataTransfer: transfer });
    await card('Pinned').trigger('dragover', { clientY: -1, dataTransfer: transfer });
    await card('Pinned').trigger('drop', { dataTransfer: transfer });
    expect(ideaOrder()).toEqual(['Pinned', 'First', 'Second', 'Third']);
    await card('First').trigger('dragover', { clientY: -1, dataTransfer: transfer });
    expect(card('First').classes()).toContain('drop-before');
    await card('First').trigger('drop', { dataTransfer: transfer });
    await vi.waitFor(() => expect(ideaOrder()).toEqual(['Pinned', 'Third', 'First', 'Second']));
    expect(wrapper.find('dialog[open]').exists()).toBe(false);
    await card('Second').get('.reorder-handle').trigger('keydown', { key: 'ArrowUp' });
    await vi.waitFor(() => expect(ideaOrder()).toEqual(['Pinned', 'Third', 'Second', 'First']));
    await card('Second').get('.reorder-handle').trigger('click');
    await wrapper.get('[aria-label="Move idea: Second up"]').trigger('click');
    await vi.waitFor(() => expect(ideaOrder()).toEqual(['Pinned', 'Second', 'Third', 'First']));
    expect(wrapper.find('dialog[open]').exists()).toBe(false);

    await card('Done-second').get('.reorder-handle').trigger('keydown', { key: 'ArrowDown' });
    await vi.waitFor(() => expect(wrapper.findAll('.done-grid .idea-title').map(el => el.text())).toEqual(['Done-first', 'Done-third', 'Done-second']));
    expect((await repository.readBoard()).ideas.filter(i => i.theme === 'a' && i.status === 'planned').map(i => i.id)).toEqual(['Second', 'Third', 'First']);
    wrapper.unmount(); await flushPromises(); wrapper = mount(BoardView, options);
    await vi.waitFor(() => expect(themeOrder()).toEqual(['a', 'c', 'b']));
    expect(ideaOrder()).toEqual(['Pinned', 'Second', 'Third', 'First']);
    expect((await repository.readBoard()).ideas.find(i => i.id === 'Elsewhere').theme).toBe('b');
  } finally { wrapper.unmount(); await flushPromises(); await repository.db.delete(); document.body.innerHTML = ''; }
});
