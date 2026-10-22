<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
const props = defineProps({ idea: Object, cache: Object, disabled: Boolean });
defineEmits(['open', 'toggle']);
const metrics = computed(() => props.idea.status === 'done' ? props.cache?.reports[props.idea.youtubeVideoId] : null);
function number(v) { return typeof v === 'number' ? v.toLocaleString() : '-'; }
</script>
<template>
  <article class="idea-card" :class="{ 'is-done': idea.status === 'done' }" :data-status="idea.status" tabindex="0" role="button" :aria-label="'Open idea: ' + idea.title" @click="$emit('open', idea)" @keydown.enter.self="$emit('open', idea)" @keydown.space.prevent.self="$emit('open', idea)">
    <div class="card-top"><span class="card-label" :class="{ selected: idea.selected && idea.status !== 'done' }"><AppIcon :name="idea.status === 'done' ? 'check' : 'note'" />{{ idea.status === 'done' ? 'Completed' : idea.selected ? 'Selected' : 'Idea' }}</span><button type="button" class="complete-toggle" :disabled="disabled" :aria-label="(idea.status === 'done' ? 'Restore to active: ' : 'Mark complete: ') + idea.title" @click.stop="$emit('toggle', idea.id)"><AppIcon :name="idea.status === 'done' ? 'check' : 'circle'" /></button></div>
    <h3 class="idea-title">{{ idea.title }}</h3><p class="idea-description">{{ idea.demo }}</p>
    <div class="card-footer"><div class="card-tags"><span class="tag">{{ idea.format }}</span><span v-if="idea.status === 'progress'" class="tag in-progress">In progress</span><span v-if="!idea.selected && idea.status !== 'done'" class="tag suggestion">Suggested</span></div><span class="card-note">{{ idea.isDemo ? 'Sample' : idea.notes ? 'Notes' : '' }}</span></div>
    <div v-if="metrics" class="yt-card-metrics">YouTube · {{ number(metrics.views) }} views · {{ number(metrics.likes) }} likes<span>{{ cache.mode === 'public' ? 'Public lifetime totals' : cache.start + ' to ' + cache.end }}</span></div>
  </article>
</template>
