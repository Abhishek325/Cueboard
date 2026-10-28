<script setup>
import { ref, nextTick } from 'vue';
import AppIcon from './AppIcon.vue';
import ChannelArtwork from './ChannelArtwork.vue';
const props = defineProps({ name: String, disabled: Boolean, channel: Object });
const emit = defineEmits(['rename', 'delete']);
const editing = ref(false), draft = ref(''), input = ref(null), invalid = ref('');
async function edit() { if (props.disabled) return; draft.value = props.name; invalid.value = ''; editing.value = true; await nextTick(); input.value?.focus(); input.value?.select(); }
function commit() {
  if (!editing.value) return;
  const name = draft.value.trim();
  editing.value = false;
  if (!name) { invalid.value = 'Project name cannot be empty.'; return; }
  invalid.value = '';
  if (name !== props.name) emit('rename', name);
}
function cancel() { editing.value = false; invalid.value = ''; }
</script>
<template>
  <div class="project-heading-row">
    <ChannelArtwork :cache="channel" kind="avatar" />
    <input v-if="editing" ref="input" v-model="draft" class="project-name-input" aria-label="Project name" maxlength="80" @blur="commit" @keydown.enter.prevent="commit" @keydown.esc.prevent="cancel">
    <h1 v-else @dblclick="edit">{{ name }}</h1>
    <button v-if="!editing" type="button" class="project-heading-action" aria-label="Rename project" title="Rename project" :disabled="disabled" @click="edit"><AppIcon name="edit" /></button>
    <button type="button" class="project-heading-action project-delete" aria-label="Delete project" title="Delete project" :disabled="disabled || editing" @click="emit('delete')"><AppIcon name="trash" /></button>
  </div>
  <p v-if="invalid" class="project-name-error" role="alert">{{ invalid }}</p>
</template>
