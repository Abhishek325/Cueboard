import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PostingCalendar from '../src/components/PostingCalendar.vue';

const navButtons = wrapper => wrapper.findAll('.calendar-nav button');

test('calendar without a YouTube snapshot is disabled while setup remains accessible', async () => {
  const wrapper = mount(PostingCalendar, { props: { cache: null } });
  try {
    expect(wrapper.get('.calendar-heading').text()).toContain('YouTube post calendar');
    expect(wrapper.get('.calendar-body').attributes('aria-disabled')).toBe('true');
    expect(navButtons(wrapper).every(button => button.element.disabled)).toBe(true);
    expect(wrapper.findAll('button.calendar-day')).toHaveLength(0);
    expect(wrapper.find('.calendar-refresh').exists()).toBe(false);
    expect(wrapper.find('.calendar-source').exists()).toBe(false);
    const month = wrapper.get('.calendar-month').text();
    await wrapper.get('[aria-label="Previous month"]').trigger('click');
    expect(wrapper.get('.calendar-month').text()).toBe(month);
    const setup = wrapper.get('[aria-label="YouTube setup"]');
    expect(setup.element.disabled).toBe(false);
    await setup.trigger('click');
    expect(wrapper.emitted('setup')).toHaveLength(1);
    expect(wrapper.emitted('refresh')).toBeUndefined();
  } finally { wrapper.unmount(); }
});

test('a fetched empty channel enables navigation and refresh, then losing the cache disables them again', async () => {
  const wrapper = mount(PostingCalendar, { props: { cache: null } });
  try {
    const currentMonth = wrapper.get('.calendar-month').text();
    await wrapper.setProps({ cache: { videos: [], fetchedAt: new Date().toISOString() } });
    expect(wrapper.get('.calendar-body').attributes('aria-disabled')).toBe('false');
    expect(navButtons(wrapper).every(button => !button.element.disabled)).toBe(true);
    await wrapper.get('[aria-label="Previous month"]').trigger('click');
    expect(wrapper.get('.calendar-month').text()).not.toBe(currentMonth);
    await wrapper.get('.calendar-refresh').trigger('click');
    expect(wrapper.emitted('refresh')).toHaveLength(1);
    await wrapper.setProps({ busy: true });
    expect(wrapper.get('.calendar-refresh').element.disabled).toBe(true);
    expect(wrapper.get('[aria-label="YouTube setup"]').element.disabled).toBe(false);
    await wrapper.get('[aria-label="YouTube setup"]').trigger('click');
    expect(wrapper.emitted('setup')).toHaveLength(1);
    await wrapper.setProps({ cache: null });
    expect(wrapper.get('.calendar-month').text()).toBe(currentMonth);
    expect(navButtons(wrapper).every(button => button.element.disabled)).toBe(true);
    expect(wrapper.find('.calendar-refresh').exists()).toBe(false);
  } finally { wrapper.unmount(); }
});

test('removing a populated cache closes the video preview and leaves setup available', async () => {
  const wrapper = mount(PostingCalendar, { attachTo: document.body, props: {
    cache: { videos: [{ id: 'demoVideo01', title: 'A published video', privacyStatus: 'public', publishedAt: new Date().toISOString() }] },
  } });
  try {
    await wrapper.get('button.has-post').trigger('click');
    expect(document.querySelector('.calendar-popover')?.textContent).toContain('A published video');
    await wrapper.setProps({ cache: null });
    expect(document.querySelector('.calendar-popover')).toBeNull();
    expect(wrapper.find('button.calendar-day').exists()).toBe(false);
    await wrapper.get('[aria-label="YouTube setup"]').trigger('click');
    expect(wrapper.emitted('setup')).toHaveLength(1);
  } finally { wrapper.unmount(); }
});
