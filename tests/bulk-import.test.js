import { test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BulkIdeaImport from '../src/components/BulkIdeaImport.vue';
function open(props = {}) { return mount(BulkIdeaImport, { props: { open: true, themes: [], ideas: [], ...props }, attachTo: document.body }); }
test('empty project import requires explicit preview and confirmation; edits invalidate preview', async () => {
  const wrapper = open({ projectName: 'My channel' });
  try {
    await wrapper.get('textarea').setValue('One idea\nOne idea\nSecond idea');
    await wrapper.get('input').setValue('Explainers');
    await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('import')).toBeUndefined();
    await wrapper.findAll('button').find(button => button.text() === 'Preview ideas').trigger('click');
    expect(wrapper.get('[aria-label="Import preview"]').text()).toContain('2 new ideas · 1 duplicates skipped');
    expect(wrapper.emitted('import')).toBeUndefined();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('import')[0][0]).toEqual({ text: 'One idea\nOne idea\nSecond idea', newThemeName: 'Explainers', format: 'Reel + Short' });
    await wrapper.get('textarea').setValue('Changed idea');
    expect(wrapper.find('[aria-label="Import preview"]').exists()).toBe(false);
    await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('import')).toHaveLength(1);
  } finally { wrapper.unmount(); }
});
test('cancel and reopen discard draft, duplicates block import, parent transaction errors remain visible', async () => {
  const wrapper = open({ themes: [{ id: 't', name: 'Tutorials' }], themeId: 't', ideas: [{ title: 'Existing' }] });
  try {
    await wrapper.get('textarea').setValue('existing');
    await wrapper.findAll('button').find(button => button.text() === 'Preview ideas').trigger('click');
    expect(wrapper.get('button[type="submit"]').element.disabled).toBe(true);
    await wrapper.get('form').trigger('submit'); expect(wrapper.emitted('import')).toBeUndefined();
    await wrapper.findAll('button').find(button => button.text() === 'Cancel').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    await wrapper.setProps({ open: false }); await wrapper.setProps({ open: true, error: 'Changes were not saved.' });
    expect(wrapper.get('textarea').element.value).toBe('');
    expect(wrapper.get('[role="alert"]').text()).toBe('Changes were not saved.');
    expect(wrapper.find('[aria-label="Import preview"]').exists()).toBe(false);
  } finally { wrapper.unmount(); }
});
