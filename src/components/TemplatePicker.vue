<script setup>
import { computed, ref, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import { starterTemplates } from '../data/templates.js';
import '../styles/templates.css';
const props = defineProps({ open: Boolean, busy: Boolean, existingNames: { type: Array, default: () => [] }, error: String, initialTemplateId: String });
const emit = defineEmits(['close', 'use']);
const selectedId = ref(starterTemplates[0].id), name = ref('');
const selected = computed(() => starterTemplates.find(item => item.id === selectedId.value));
function suggestName(base) {
  const existing = new Set(props.existingNames.map(value => value.toLowerCase()));
  let suggestion = base, count = 2;
  while (existing.has(suggestion.toLowerCase())) suggestion = `${base} (${count++})`;
  return suggestion;
}
function choose(id) { selectedId.value = id; name.value = suggestName(selected.value.name); }
watch(() => props.open, open => { if (open) choose(starterTemplates.some(item => item.id === props.initialTemplateId) ? props.initialTemplateId : starterTemplates[0].id); }, { immediate: true });
const nameError = computed(() => {
  const clean = name.value.trim();
  if (!clean || clean.length > 80) return 'Enter a project name between 1 and 80 characters.';
  if (props.existingNames.some(value => value.toLowerCase() === clean.toLowerCase())) return 'A project with that name already exists.';
  if (props.existingNames.length >= 50) return 'You can create up to 50 projects.';
  return '';
});
function submit() {
  if (!props.busy && !nameError.value) emit('use', { templateId: selectedId.value, name: name.value.trim() });
}
</script>
<template>
  <ModalDialog :open="open" title="Starter templates" @close="!busy && emit('close')">
    <form class="template-picker" @submit.prevent="submit">
      <div class="dialog-content template-content">
        <p class="template-intro">Start with a useful structure. Creates a new project; your current board stays as it is.</p>
        <div class="template-options" role="group" aria-label="Choose a starter template">
          <button v-for="item in starterTemplates" :key="item.id" type="button" class="template-option" :class="{ 'is-selected': selectedId === item.id }" :aria-pressed="selectedId === item.id" :disabled="busy" @click="choose(item.id)">
            <strong>{{ item.name }}</strong><span>{{ item.description }}</span>
          </button>
        </div>
        <section class="template-preview" :aria-label="selected.name + ' preview'">
          <h2>{{ selected.name }}</h2>
          <p>{{ selected.themes.length }} themes · {{ selected.ideas.length }} editable ideas · Nothing published or connected</p>
          <div v-for="(theme, index) in selected.themes" :key="theme.name" class="template-theme">
            <h3><span :style="{ background: theme.color }"></span>{{ theme.name }}</h3>
            <ul><li v-for="idea in selected.ideas.filter(item => item.theme === index)" :key="idea.title">{{ idea.title }}<small>{{ idea.value }}</small></li></ul>
          </div>
        </section>
        <label class="template-name-label" for="template-project-name">New project name</label>
        <input id="template-project-name" v-model="name" class="yt-input" maxlength="80" required :disabled="busy" :aria-invalid="!!nameError" :aria-describedby="nameError ? 'template-name-error' : undefined" autocomplete="off" />
        <p v-if="nameError" id="template-name-error" class="template-error">{{ nameError }}</p>
        <p v-if="error" class="template-error" role="alert">{{ error }}</p>
        <p class="template-note">These are suggested exercises. Edit or delete any card. YouTube setup starts empty for this project.</p>
      </div>
      <div class="dialog-footer"><button type="button" class="btn btn-quiet" :disabled="busy" @click="emit('close')">Cancel</button><button class="btn btn-primary" type="submit" :disabled="busy || !!nameError">{{ busy ? 'Creating project…' : 'Use this template' }}</button></div>
    </form>
  </ModalDialog>
</template>
