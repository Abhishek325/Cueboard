<script setup>
import { ref, watch, nextTick } from 'vue';
const props = defineProps({ open: Boolean, title: String });
const emit = defineEmits(['close']);
const dialog = ref(null);
watch(() => props.open, async open => { await nextTick(); if (!dialog.value) return; if (open && !dialog.value.open) dialog.value.showModal(); else if (!open && dialog.value.open) dialog.value.close(); }, { immediate: true });
</script>
<template>
  <dialog ref="dialog" :aria-label="title" @cancel.prevent="emit('close')" @close="emit('close')">
    <div class="dialog-top"><span>{{ title }}</span><button type="button" class="dialog-close" aria-label="Close dialog" @click="emit('close')">&times;</button></div>
    <slot />
  </dialog>
</template>
