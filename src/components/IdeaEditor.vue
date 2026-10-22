<script setup>
import { reactive, ref, watch, computed } from 'vue';
import ModalDialog from './ModalDialog.vue';
import { formats } from '../lib/board.js';
import { videoId } from '../lib/youtube.js';
const props = defineProps({ open: Boolean, idea: Object, themeId: String, themes: Array, busy: Boolean, cache: Object, stamp: String });
const emit = defineEmits(['close', 'save', 'delete']);
const form = reactive({}), validation = ref('');
watch(() => props.open, open => { if (open) { validation.value = ''; Object.assign(form, { id: '', title: '', theme: props.themeId || props.themes[0]?.id || '', status: 'planned', format: formats[0], selected: false, demo: '', value: '', notes: '', youtubeVideoId: '' }, props.idea || {}); } });
function submit() { const id = videoId(form.youtubeVideoId); if (form.youtubeVideoId.trim() && !id) { validation.value = 'Enter a valid YouTube video link or 11-character ID.'; return; } emit('save', { ...form, title: form.title.trim(), youtubeVideoId: id || '' }); }
const report = computed(() => props.cache?.reports[videoId(form.youtubeVideoId)]);
const linked = computed(() => props.cache?.videos.find(v => v.id === videoId(form.youtubeVideoId)));
const metrics = computed(() => props.cache?.mode === 'public' ? [['Views', 'views'], ['Likes', 'likes'], ['Comments', 'comments']] : [['Views', 'views'], ['Engaged views', 'engagedViews'], ['Likes', 'likes'], ['Comments', 'comments'], ['Shares', 'shares'], ['Subscribers gained', 'subscribersGained'], ['Average view duration', 'averageViewDuration', 's'], ['Average viewed', 'averageViewPercentage', '%'], ['Watch time', 'estimatedMinutesWatched', ' min']]);
function number(v, suffix = '') { return typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 1 }) + suffix : '-'; }
</script>
<template>
  <ModalDialog :open="open" :title="idea ? 'Idea details' : 'New idea'" @close="emit('close')">
    <form @submit.prevent="submit"><div class="dialog-content">
      <label class="visually-hidden" for="idea-title">Idea title</label><textarea id="idea-title" v-model="form.title" autofocus class="dialog-title-input" required maxlength="240" rows="2" placeholder="Give your idea a title..."></textarea>
      <div class="property"><label for="idea-theme">Theme</label><select id="idea-theme" v-model="form.theme" required><option v-for="t in themes" :key="t.id" :value="t.id">{{ t.name }}</option></select></div>
      <div class="property"><label for="idea-status">Status</label><select id="idea-status" v-model="form.status"><option value="planned">Not started</option><option value="progress">In progress</option><option value="done">Complete</option></select></div>
      <div class="property"><label for="idea-format">Format</label><select id="idea-format" v-model="form.format"><option v-for="f in formats" :key="f">{{ f }}</option></select></div>
      <div class="property"><span>Selection</span><label class="selection-check"><input v-model="form.selected" type="checkbox">Selected for production</label></div>
      <div v-for="field in [['demo', `What we'll show`, 'The input, the action and the result.'], ['value', 'Value for the viewer', 'What will viewers learn?'], ['notes', 'Your notes', 'Production notes, next steps or results...']]" :key="field[0]" class="dialog-section"><label :for="'idea-' + field[0]">{{ field[1] }}</label><textarea :id="'idea-' + field[0]" v-model="form[field[0]]" :placeholder="field[2]" maxlength="5000"></textarea></div>
      <div class="dialog-section"><label for="idea-youtube">YouTube video</label><input id="idea-youtube" v-model="form.youtubeVideoId" class="yt-input" list="video-options" placeholder="YouTube video link or ID" maxlength="500"><datalist id="video-options"><option v-for="v in cache?.videos || []" :key="v.id" :value="v.id">{{ v.title }}</option></datalist><p class="yt-fetched">{{ linked?.title || 'Paste a video URL or choose a fetched upload.' }}</p><p v-if="validation" role="alert" class="yt-error">{{ validation }}</p>
      <div v-if="report" class="yt-metrics"><div v-for="m in metrics" :key="m[1]"><span>{{ m[0] }}</span><strong>{{ number(report[m[1]], m[2]) }}</strong></div></div><p class="yt-fetched">{{ report ? stamp : form.youtubeVideoId ? 'No saved report for this video. Missing data is not zero.' : '' }}</p></div>
    </div><div class="dialog-footer"><div class="dialog-left"><button v-if="idea" type="button" class="text-danger" :disabled="busy" @click="emit('delete', idea)">Delete</button><button v-if="idea" type="button" class="complete-action" @click="form.status = form.status === 'done' ? 'planned' : 'done'">{{ form.status === 'done' ? 'Restore to active' : 'Mark complete' }}</button></div><div class="right"><button class="btn btn-quiet" type="button" @click="emit('close')">Cancel</button><button class="btn btn-primary" type="submit" :disabled="busy">{{ busy ? 'Saving...' : 'Save changes' }}</button></div></div></form>
  </ModalDialog>
</template>
