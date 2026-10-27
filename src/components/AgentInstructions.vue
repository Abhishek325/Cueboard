<script setup>
import { computed, ref, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import { buildAgentInstructions, statusLabels } from '../lib/agent-instructions.js';
import '../styles/agent-instructions.css';
const props = defineProps({ open: Boolean, project: Object, board: Object });
const emit = defineEmits(['close']);
const mode = ref('propose'), task = ref(''), selected = ref([]), feedback = ref('');
const instructions = computed(() => buildAgentInstructions({ project: props.project, board: props.board, mode: mode.value, task: task.value, ideaIds: selected.value, url: `${window.location.origin}${window.location.pathname}#/` }));
watch(() => props.open, open => { if (open) { mode.value = 'propose'; task.value = ''; selected.value = []; feedback.value = ''; } });
watch(instructions, () => { feedback.value = ''; });
async function copy() {
  try { await navigator.clipboard.writeText(instructions.value); feedback.value = 'Instructions copied. Paste them into your agent chat.'; }
  catch { feedback.value = 'Could not copy automatically. Select and copy the instructions below.'; }
}
</script>
<template>
  <ModalDialog :open="open" title="Use with an agent" @close="emit('close')">
    <div class="dialog-content agent-panel">
      <p class="agent-intro">One board. Clear to you and your agent.</p>
      <p class="detail-value">Copy project instructions into your own browser-capable agent. It needs the browser profile containing this board. Slateory does not run an agent or update in the background.</p>
      <p class="agent-project">Project: <strong>{{ project.name }}</strong></p>
      <label for="agent-permission">What may the agent do?</label>
      <select id="agent-permission" v-model="mode"><option value="propose">Propose changes for my review</option><option value="maintain">Maintain work I authorize in this task</option></select>
      <label for="agent-task">Task for the agent</label>
      <textarea id="agent-task" v-model="task" rows="3" maxlength="5000" placeholder="e.g. Update the voiceover idea with the decisions we agreed on. Keep it In progress until I confirm publication."></textarea>
      <details v-if="board.ideas.length" class="agent-context"><summary>Include selected cards ({{ selected.length }})</summary><p>Optional. Selected cards include their full notes and links. Review before sharing; connection settings and API keys are excluded.</p><div class="agent-card-options"><label v-for="idea in board.ideas" :key="idea.id"><input v-model="selected" type="checkbox" :value="idea.id"><span>{{ idea.title }}<small>{{ board.themes.find(theme => theme.id === idea.theme)?.name }} · {{ statusLabels[idea.status] }}</small></span></label></div></details>
      <details class="agent-preview"><summary>Review instructions</summary><label class="visually-hidden" for="agent-instructions-preview">Instructions to copy</label><textarea id="agent-instructions-preview" :value="instructions" readonly rows="12" spellcheck="false"></textarea></details>
      <p class="agent-feedback" role="status" aria-live="polite">{{ feedback }}</p>
    </div>
    <div class="dialog-footer agent-footer"><button type="button" class="btn btn-quiet" @click="emit('close')">Close</button><button type="button" class="btn btn-primary" @click="copy">Copy agent instructions</button></div>
  </ModalDialog>
</template>
