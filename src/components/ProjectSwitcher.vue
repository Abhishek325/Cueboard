<script setup>
import AppIcon from './AppIcon.vue';
const props = defineProps({ projects: Array, activeId: String, count: Number, disabled: Boolean });
const emit = defineEmits(['switch', 'create']);
function change(event) {
  const value = event.target.value; event.target.value = props.activeId;
  if (value === '__create__') emit('create');
  else emit('switch', value);
}
</script>
<template>
  <div class="project-switcher"><AppIcon name="board" /><label class="visually-hidden" for="project-switcher">Switch project</label><select id="project-switcher" :value="activeId" :disabled="disabled" @change="change"><optgroup label="Projects"><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option></optgroup><optgroup label="Manage projects"><option value="__create__">+ New project…</option></optgroup></select><span class="project-idea-count">{{ count }}</span></div>
</template>
