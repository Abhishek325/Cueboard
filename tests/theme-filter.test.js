import { test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ThemeFilter from '../src/components/ThemeFilter.vue';
const themes = [{ id: 'a', name: 'Tutorials' }, { id: 'b', name: 'Behind the scenes' }, { id: 'c', name: 'Reviews' }, { id: 'd', name: 'Explainers' }];
function mountFilter() {
  return mount({ components: { ThemeFilter }, setup() { return { selected: ref(null), themes }; }, template: '<ThemeFilter v-model="selected" :themes="themes" />' }, { attachTo: document.body });
}
test('theme filter selects one or several themes and restores all with consistent checkboxes', async () => {
  const wrapper = mountFilter();
  const checks = () => wrapper.findAll('input').map(input => input.element.checked);
  try {
    await wrapper.get('[aria-label="Filter themes"]').trigger('click');
    expect(checks()).toEqual([true, true, true, true]);
    await wrapper.get('[aria-label="Clear theme selection"]').trigger('click');
    expect(checks()).toEqual([false, false, false, false]);
    await wrapper.findAll('input')[0].setValue(true);
    expect(wrapper.vm.selected).toEqual(['a']);
    await wrapper.findAll('input')[2].setValue(true);
    expect(wrapper.vm.selected).toEqual(['a', 'c']);
    expect(wrapper.get('.theme-filter-count').text()).toBe('2');
    expect(wrapper.get('[aria-label="Filter themes"]').attributes('aria-expanded')).toBe('true');
    await wrapper.get('[aria-label="Show all themes"]').trigger('click');
    expect(wrapper.vm.selected).toBeNull();
    expect(checks()).toEqual([true, true, true, true]);
    expect(wrapper.find('.theme-filter-count').exists()).toBe(false);
  } finally { wrapper.unmount(); }
});
test('Escape restores filter-button focus; outside clicks close it; creating a theme stays available', async () => {
  const wrapper = mountFilter();
  try {
    const trigger = wrapper.get('[aria-label="Filter themes"]');
    await trigger.trigger('click');
    await wrapper.get('input').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(document.activeElement).toBe(trigger.element);
    await trigger.trigger('click');
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    await trigger.trigger('click');
    await wrapper.get('[aria-label="New theme"]').trigger('click');
    expect(wrapper.findComponent(ThemeFilter).emitted('create')).toHaveLength(1);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  } finally { wrapper.unmount(); }
});
