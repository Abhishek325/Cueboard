import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectHeading from '../src/components/ProjectHeading.vue';
test('heading saves automatically on blur or Enter, Escape cancels, and empty names preserve the title', async () => {
  const wrapper = mount(ProjectHeading, { props: { name: 'Original' } });
  await wrapper.get('[aria-label="Rename project"]').trigger('click');
  await wrapper.get('input').setValue(' Changed '); await wrapper.get('input').trigger('keydown', { key: 'Enter' });
  expect(wrapper.emitted('rename')).toEqual([['Changed']]);
  expect(wrapper.find('input').exists()).toBe(false);
  await wrapper.get('[aria-label="Rename project"]').trigger('click');
  await wrapper.get('input').setValue('Cancel this'); await wrapper.get('input').trigger('keydown', { key: 'Escape' });
  expect(wrapper.emitted('rename')).toHaveLength(1);
  await wrapper.get('[aria-label="Rename project"]').trigger('click');
  await wrapper.get('input').setValue('  '); await wrapper.get('input').trigger('blur');
  expect(wrapper.get('h1').text()).toBe('Original'); expect(wrapper.get('[role="alert"]').text()).toContain('cannot be empty');
  expect(wrapper.emitted('rename')).toHaveLength(1); wrapper.unmount();
});
