<script setup>
import { ref, computed, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
import { formats } from '../lib/board.js';
import { previewIdeas, planIdeaImport } from '../lib/bulk-ideas.js';
import '../styles/bulk-import.css';
const props = defineProps({ open: Boolean, themes: { type: Array, default: () => [] }, ideas: { type: Array, default: () => [] }, themeId: String, busy: Boolean, projectName: String, error: String });
const emit = defineEmits(['close', 'import']);
const text = ref(''), target = ref(''), newName = ref(''), format = ref('Reel + Short'), reviewed = ref(false);
const preview = computed(() => previewIdeas(text.value, props.ideas));
const payload = computed(() => ({ text: text.value, format: format.value, ...(target.value === '__new__' ? { newThemeName: newName.value } : { themeId: target.value }) }));
const error = computed(() => { try { planIdeaImport({ themes: props.themes, ideas: props.ideas }, payload.value); return ''; } catch (e) { return e.message; } });
watch(() => props.open, open => { if (open) { text.value = ''; newName.value = ''; format.value = 'Reel + Short'; reviewed.value = false; target.value = props.themes.some(theme => theme.id === props.themeId) ? props.themeId : props.themes[0]?.id || '__new__'; } }, { immediate: true });
watch([text, target, newName, format], () => { reviewed.value = false; });
function close() { if (!props.busy) emit('close'); }
</script>
<template>
  <ModalDialog :open="open" title="Paste ideas" @close="close">
    <form class="bulk-import" @submit.prevent="reviewed && !error && !busy && emit('import', payload)">
      <p>Add titles to {{ projectName || 'this project' }}, one per line. Blank lines are ignored; duplicate titles are skipped across this project.</p>
      <label for="bulk-idea-text">Idea titles</label>
      <textarea id="bulk-idea-text" v-model="text" rows="7" maxlength="100000" :disabled="busy" placeholder="What I learned from my first upload&#10;Three ways to open a tutorial&#10;How I record a clean voiceover"></textarea>
      <div class="bulk-import-options">
        <label>Theme<select v-model="target" :disabled="busy"><option v-for="theme in themes" :key="theme.id" :value="theme.id">{{ theme.name }}</option><option value="__new__">+ Create a new theme</option></select></label>
        <label>Format<select v-model="format" :disabled="busy"><option v-for="item in formats" :key="item">{{ item }}</option></select></label>
      </div>
      <label v-if="target === '__new__'">New theme name<input v-model="newName" maxlength="120" :disabled="busy" placeholder="e.g. Behind the scenes"></label>
      <p v-if="props.error" role="alert">{{ props.error }}</p>
      <p class="bulk-import-help">Up to 200 titles per import; 240 characters per title. New cards start as Suggested. Existing ideas stay unchanged.</p>
      <section v-if="reviewed" class="bulk-preview" aria-label="Import preview" aria-live="polite">
        <strong>{{ preview.titles.length }} new ideas · {{ preview.skipped }} duplicates skipped</strong>
        <p v-if="error" role="alert">{{ error }}</p>
        <ol><li v-for="row in preview.rows.slice(0, 200)" :key="row.line" :class="'bulk-row-' + row.status"><span>{{ row.title }}</span><small>{{ row.reason }}</small></li></ol>
        <p v-if="preview.rows.length > 200">Showing the first 200 rows. Reduce this batch before importing.</p>
      </section>
      <div class="dialog-actions">
        <button type="button" class="btn btn-quiet" :disabled="busy" @click="close">Cancel</button>
        <button v-if="!reviewed" type="button" class="btn btn-primary" :disabled="busy || !text.trim()" @click="reviewed = true">Preview ideas</button>
        <button v-else type="submit" class="btn btn-primary" :disabled="busy || !!error">{{ busy ? 'Importing…' : `Import ${preview.titles.length} ideas` }}</button>
      </div>
    </form>
  </ModalDialog>
</template>
