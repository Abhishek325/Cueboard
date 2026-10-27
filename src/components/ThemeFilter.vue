<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import AppIcon from './AppIcon.vue';
const props = defineProps({ themes: Array, modelValue: { default: null }, disabled: Boolean });
const emit = defineEmits(['update:modelValue', 'create']);
const open = ref(false), root = ref(null), trigger = ref(null);
const selected = computed(() => props.modelValue === null ? props.themes.map(t => t.id) : props.modelValue);
const active = computed(() => props.modelValue !== null);
async function toggle() { open.value = !open.value; if (open.value) { await nextTick(); root.value.querySelector('input')?.focus({ preventScroll: true }); } }
function choose(id, checked) {
  const ids = checked ? [...selected.value, id] : selected.value.filter(value => value !== id);
  emit('update:modelValue', ids.length === props.themes.length ? null : ids);
}
function outside(event) { if (!root.value?.contains(event.target)) open.value = false; }
function escape(event) { if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); open.value = false; trigger.value.focus({ preventScroll: true }); } }
function create() { open.value = false; emit('create'); }
onMounted(() => document.addEventListener('pointerdown', outside));
onUnmounted(() => document.removeEventListener('pointerdown', outside));
</script>
<template>
  <div ref="root" class="theme-filter" @keydown="escape">
    <button ref="trigger" type="button" class="theme-filter-toggle" :class="{ 'is-active': active }" :disabled="disabled" aria-label="Filter themes" :aria-expanded="open" aria-haspopup="dialog" aria-controls="theme-filter-panel" :title="active ? selected.length + ' themes selected' : 'Showing all themes'" @click="toggle"><AppIcon name="filter" /><span v-if="active" class="theme-filter-count" aria-hidden="true">{{ selected.length }}</span></button>
    <div v-if="open" id="theme-filter-panel" class="theme-filter-panel" role="dialog" aria-label="Filter themes">
      <div class="theme-filter-heading"><strong>Show themes</strong><span>{{ selected.length }} of {{ themes.length }}</span></div>
      <div class="theme-filter-actions"><button type="button" aria-label="Show all themes" @click="$emit('update:modelValue', null)">All themes</button><button type="button" aria-label="Clear theme selection" @click="$emit('update:modelValue', [])">Clear</button></div>
      <div class="theme-filter-options"><label v-for="theme in themes" :key="theme.id"><input type="checkbox" :checked="selected.includes(theme.id)" @change="choose(theme.id, $event.target.checked)"><span class="theme-dot" :style="{ '--dot': theme.color }"></span><span>{{ theme.name }}</span></label></div>
      <button type="button" class="theme-filter-create" :disabled="disabled" aria-label="New theme" @click="create"><AppIcon name="plus" />New theme</button>
    </div>
  </div>
</template>
