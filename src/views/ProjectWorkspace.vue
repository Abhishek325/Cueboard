<script setup>
import { ref, onMounted } from 'vue';
import { useProjects } from '../composables/useProjects.js';
import BoardView from './BoardView.vue';
import ModalDialog from '../components/ModalDialog.vue';
const props = defineProps({ store: Object });
const p = useProjects(props.store);
const editor = ref(false), name = ref(''), deleting = ref(false), deletingName = ref('');
function create() { name.value = ''; p.error.value = ''; editor.value = true; }
async function save() { if (await p.save(name.value)) editor.value = false; }
function confirmDelete() { deletingName.value = p.active.value.name; p.error.value = ''; deleting.value = true; }
async function remove() { if (await p.remove()) deleting.value = false; }
onMounted(p.start);
</script>
<template>
  <div v-if="p.loading.value || (!p.projectRepository.value && p.busy.value)" class="workspace-loading" role="status">{{ p.busy.value ? 'Deleting project…' : 'Opening your projects…' }}</div>
  <div v-else-if="!p.projectRepository.value" class="workspace-loading"><p role="alert">{{ p.error.value }}</p><button class="btn btn-quiet" @click="p.start">Try again</button></div>
  <BoardView v-else :key="p.activeId.value" :repo="p.projectRepository.value" :project="p.active.value" :projects="p.projects.value" :project-busy="p.busy.value" :project-error="editor || deleting ? '' : p.error.value" @switch-project="p.switchProject" @create-project="create" @rename-project="p.save($event, p.activeId.value)" @delete-project="confirmDelete" />
  <ModalDialog :open="editor" title="New project" @close="!p.busy.value && (editor = false)"><form @submit.prevent="save"><div class="dialog-content"><div class="dialog-section"><label for="project-name">Project name</label><input id="project-name" v-model="name" class="yt-input" required maxlength="80" autofocus placeholder="e.g. Travel videos"></div><p class="detail-value">Start with an empty board. Themes, ideas and YouTube setup belong to this project.</p><p v-if="p.error.value" class="yt-error" role="alert">{{ p.error.value }}</p></div><div class="dialog-footer"><button type="button" class="btn btn-quiet" :disabled="p.busy.value" @click="editor = false">Cancel</button><button type="submit" class="btn btn-primary" :disabled="p.busy.value">{{ p.busy.value ? 'Saving…' : 'Create project' }}</button></div></form></ModalDialog>
  <ModalDialog :open="deleting" title="Delete project" @close="!p.busy.value && (deleting = false)"><div class="dialog-content"><p class="detail-value">Delete “{{ deletingName }}” and all its themes, ideas, saved YouTube settings and cached reports? This cannot be undone. Export a backup first if you want to keep the content.</p><p class="detail-value">{{ p.projects.value.length === 1 ? 'An empty Content board will replace this project.' : 'Your other projects will stay unchanged.' }}</p><p v-if="p.error.value" class="yt-error" role="alert">{{ p.error.value }}</p></div><div class="dialog-footer"><button type="button" class="btn btn-quiet" :disabled="p.busy.value" @click="deleting = false">Cancel</button><button type="button" class="btn btn-primary btn-danger" :disabled="p.busy.value" @click="remove">{{ p.busy.value ? 'Deleting…' : 'Delete project' }}</button></div></ModalDialog>
</template>
