<script setup>
import { reactive, watch } from 'vue';
import ModalDialog from './ModalDialog.vue';
const props = defineProps({ open: Boolean, theme: Object, busy: Boolean, count: Number });
const emit = defineEmits(['save', 'close', 'delete']);
const form = reactive({});
watch(() => props.open, open => { if (open) Object.assign(form, { id: '', name: '', description: '', color: '#799588' }, props.theme || {}); });
</script>
<template><ModalDialog :open="open" :title="theme ? 'Edit theme' : 'New theme'" @close="emit('close')"><form @submit.prevent="emit('save', { ...form, name: form.name.trim() })"><div class="dialog-content"><div class="dialog-section"><label for="theme-name">Theme name</label><input id="theme-name" v-model="form.name" autofocus class="yt-input" required maxlength="120" placeholder="e.g. Practical tutorials"></div><div class="dialog-section"><label for="theme-description">Description</label><textarea id="theme-description" v-model="form.description" maxlength="500" placeholder="What belongs in this bucket?"></textarea></div><div class="property"><label for="theme-color">Color</label><input id="theme-color" v-model="form.color" type="color"></div><p class="detail-value">{{ theme ? count + ' ideas in this theme.' : 'Themes become columns on your board.' }}</p></div><div class="dialog-footer"><button v-if="theme" type="button" class="text-danger" :disabled="busy" @click="emit('delete', theme)">Delete theme</button><div class="right"><button type="button" class="btn btn-quiet" @click="emit('close')">Cancel</button><button type="submit" class="btn btn-primary" :disabled="busy">{{ busy ? 'Saving...' : 'Save theme' }}</button></div></div></form></ModalDialog></template>
