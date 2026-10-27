<script setup>
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
const props = defineProps({ label: String, horizontal: Boolean, disabled: Boolean, canPrevious: Boolean, canNext: Boolean });
const emit = defineEmits(['start', 'end', 'move']);
const expanded = ref(false);
const unavailable = computed(() => props.disabled || (!props.canPrevious && !props.canNext));
const previous = computed(() => props.horizontal ? 'left' : 'up');
const next = computed(() => props.horizontal ? 'right' : 'down');
function move(direction) { if (!props.disabled && (direction < 0 ? props.canPrevious : props.canNext)) emit('move', direction); }
function key(event) {
  const direction = props.horizontal ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 };
  if (event.key in direction) { event.preventDefault(); event.stopPropagation(); move(direction[event.key]); }
  if (event.key === 'Escape') { event.stopPropagation(); expanded.value = false; }
}
function leave(event) { if (!event.currentTarget.contains(event.relatedTarget)) expanded.value = false; }
</script>
<template>
  <div class="reorder-control" :class="{ 'is-horizontal': horizontal }" @click.stop @focusout="leave">
    <button type="button" class="reorder-handle" :disabled="unavailable" :draggable="!unavailable" :aria-label="'Reorder ' + label" :aria-expanded="expanded" :title="'Drag to reorder, or use ' + previous + '/' + next + ' arrow keys'" @click="expanded = !expanded" @keydown="key" @dragstart="expanded = false; $emit('start', $event)" @dragend="$emit('end')"><svg viewBox="0 0 18 18" aria-hidden="true"><circle v-for="(p, n) in [[6,4],[12,4],[6,9],[12,9],[6,14],[12,14]]" :key="n" :cx="p[0]" :cy="p[1]" r="1" /></svg></button>
    <div v-if="expanded" class="reorder-options">
      <button type="button" :disabled="disabled || !canPrevious" :aria-label="'Move ' + label + ' ' + previous" :title="'Move ' + previous" @click="move(-1)"><AppIcon name="arrow" class="reorder-previous" /></button>
      <button type="button" :disabled="disabled || !canNext" :aria-label="'Move ' + label + ' ' + next" :title="'Move ' + next" @click="move(1)"><AppIcon name="arrow" class="reorder-next" /></button>
    </div>
  </div>
</template>
