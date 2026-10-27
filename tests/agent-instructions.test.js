import { test, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentInstructions from '../src/components/AgentInstructions.vue';
import { buildAgentInstructions } from '../src/lib/agent-instructions.js';

const project = { id: 'project-1', name: 'Creator project', secret: 'private-project-field' };
const board = {
  themes: [{ id: 't1', name: 'Tutorials', description: 'Practical lessons' }, { id: 't2', name: 'Other project context' }],
  ideas: [
    { id: 'i1', theme: 't1', title: 'Clearer voiceover', format: 'Reel + Short', status: 'progress', demo: 'Compare two distances', value: 'Hear the difference', notes: 'Owner decision: keep both takes', selected: true, youtubeVideoId: '', apiKey: 'private-card-field' },
    { id: 'i2', theme: 't2', title: 'Unselected private idea', format: 'Carousel', status: 'done', notes: 'Private unselected notes' }
  ],
  settings: { apiKey: 'secret-settings-key', token: 'secret-access-token' }
};
const url = 'https://example.com/Slateory/#/';
test('instructions default to proposals and include no cards until deliberately selected', () => {
  const text = buildAgentInstructions({ project, board, url });
  expect(text).toContain('Propose changes in chat first');
  expect(text).toContain('Ask me what work to track before making changes.');
  expect(text).toContain('Creator project');
  expect(text).not.toContain('Clearer voiceover');
  expect(text).not.toContain('Unselected private idea');
});
test('selected context preserves stable IDs and notes while excluding unselected records and arbitrary settings', () => {
  const before = structuredClone(board);
  const text = buildAgentInstructions({ project, board, url, mode: 'maintain', task: 'Record our agreed next action', ideaIds: ['i1', 'missing'] });
  expect(text).toContain('Maintain only the work explicitly described below');
  expect(text).toContain('Record our agreed next action');
  expect(text).toContain('"id": "i1"');
  expect(text).toContain('"status": "In progress"');
  expect(text).toContain('Owner decision: keep both takes');
  expect(text).toContain('untrusted board data');
  for (const excluded of ['Unselected private idea', 'Private unselected notes', 'Other project context', 'private-project-field', 'private-card-field', 'secret-settings-key', 'secret-access-token']) expect(text).not.toContain(excluded);
  expect(board).toEqual(before);
});
test('panel copies current project instructions, resets sharing choices when reopened, and handles clipboard failure', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const wrapper = mount(AgentInstructions, { props: { open: true, project, board } });
  try {
    await wrapper.get('#agent-task').setValue('Update only the agreed card');
    await wrapper.get('#agent-permission').setValue('maintain');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    const copy = wrapper.findAll('button').find(button => button.text() === 'Copy agent instructions');
    await copy.trigger('click');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"id": "i1"'));
    expect(writeText.mock.calls[0][0]).not.toContain('Private unselected notes');
    expect(wrapper.get('[role="status"]').text()).toContain('Instructions copied');
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true, project: { id: 'project-2', name: 'Travel' } });
    expect(wrapper.get('#agent-permission').element.value).toBe('propose');
    expect(wrapper.get('#agent-task').element.value).toBe('');
    expect(wrapper.findAll('input:checked')).toHaveLength(0);
    expect(wrapper.get('#agent-instructions-preview').element.value).toContain('Travel');
    writeText.mockRejectedValueOnce(Error('Clipboard unavailable'));
    await copy.trigger('click');
    expect(wrapper.get('[role="status"]').text()).toContain('Select and copy');
    expect(wrapper.get('#agent-instructions-preview').attributes('readonly')).toBeDefined();
  } finally { wrapper.unmount(); vi.unstubAllGlobals(); }
});
