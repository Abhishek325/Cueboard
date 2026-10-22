<script setup>
import { provide } from 'vue';
import { useAppearance } from './composables/useAppearance.js';
import IconSymbols from './components/IconSymbols.vue';
provide('appearance', useAppearance());
</script>
<template><IconSymbols /><RouterView /></template>
