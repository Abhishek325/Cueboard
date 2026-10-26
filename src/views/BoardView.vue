<script setup>
import { computed, ref, onMounted, onUnmounted, inject, watch } from 'vue';
import { useBoard } from '../composables/useBoard.js';
import { useYoutube } from '../composables/useYoutube.js';
import { validate } from '../lib/board.js';
import AppIcon from '../components/AppIcon.vue';
import PostingCalendar from '../components/PostingCalendar.vue';
import IdeaCard from '../components/IdeaCard.vue';
import IdeaEditor from '../components/IdeaEditor.vue';
import ThemeEditor from '../components/ThemeEditor.vue';
import ModalDialog from '../components/ModalDialog.vue';
import YouTubeSettings from '../components/YouTubeSettings.vue';
const appearance = inject('appearance');
const b = useBoard(), y = useYoutube(() => b.board.value.ideas);
const filter = ref(''), query = ref(''), showDone = ref(true), sidebar = ref(false), ideaOpen = ref(false), themeOpen = ref(false), ytOpen = ref(false);
const editingIdea = ref(null), editingTheme = ref(null), newThemeId = ref(''), confirmation = ref(null), search = ref(null), doneDivider = ref(null), importFile = ref(null);
const board = b.board, loading = b.loading, busy = b.busy, error = b.error, message = b.message;
const themes = computed(() => board.value.themes.filter(t => !filter.value || t.id === filter.value));
watch(() => board.value.themes, values => { if (filter.value && !values.some(t => t.id === filter.value)) filter.value = ''; });
const completed = computed(() => board.value.ideas.filter(i => i.status === 'done').length);
const allCompleted = ref(false);
const searching = computed(() => !!query.value.trim());
const completedOverflow = computed(() => themes.value.reduce((count, t) => count + Math.max(0, items(t.id, true).length - 2), 0));
function matches(i) { return (!query.value || [i.title, i.demo, i.value, i.notes].join(' ').toLowerCase().includes(query.value.trim().toLowerCase())); }
function items(theme, done = false) {
  const ideas = board.value.ideas.filter(i => i.theme === theme && (i.status === 'done') === done && matches(i));
  return done ? ideas : ideas.sort((a, b) => Number(b.status === 'progress') - Number(a.status === 'progress'));
}
function completedItems(theme) { const ideas = items(theme, true); return allCompleted.value || searching.value ? ideas : ideas.slice(0, 2); }
function isCompletedPreview(theme, index) { return index === 1 && !allCompleted.value && !searching.value && items(theme, true).length > 2; }
function openTheme(theme = null) { editingTheme.value = theme; themeOpen.value = true; }
function openIdea(idea = null, themeId = '') { if (!board.value.themes.length) { openTheme(); b.notify('Create a theme for your first idea.'); return; } editingIdea.value = idea; newThemeId.value = themeId || filter.value; ideaOpen.value = true; }
async function saveTheme(form) { if (await b.saveTheme(form)) themeOpen.value = false; }
async function saveIdea(form) { if (await b.saveIdea(form)) ideaOpen.value = false; }
function ask(title, text, action) { confirmation.value = { title, text, action }; }
function deleteTheme(theme) { themeOpen.value = false; ask('Delete theme', 'Delete this theme and all its ideas? You can Undo this change.', async () => { if (await b.deleteTheme(theme.id)) { if (filter.value === theme.id) filter.value = ''; } }); }
function deleteIdea(idea) { ideaOpen.value = false; ask('Delete idea', 'Delete this idea? You can Undo this change.', () => b.deleteIdea(idea.id)); }
function removeDemo() { ask('Remove demo data', 'Remove sample ideas and unused sample themes? Your content, including sample cards you edited and saved, will stay. You can Undo this change.', async () => { if (await b.removeDemo()) { if (!board.value.themes.some(t => t.id === filter.value)) filter.value = ''; } }); }
async function confirm() { const action = confirmation.value?.action; confirmation.value = null; if (action) await action(); }
function filterTo(id) { filter.value = id; sidebar.value = false; }
function download() { const blob = new Blob([JSON.stringify({ ...board.value, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'content-board-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
async function restore(event) { const file = event.target.files[0]; event.target.value = ''; if (!file) return; try { if (file.size > 3000000) throw Error('Choose a board backup smaller than 3 MB.'); const data = JSON.parse(await file.text()); if (!validate(data)) throw Error('That file is not a valid board backup.'); ask('Restore board backup', 'Replace this browser’s board with ' + data.ideas.length + ' ideas across ' + data.themes.length + ' themes? Export the current board first if you want to keep it.', async () => { if (await b.restore(data)) { filter.value = ''; query.value = ''; } }); } catch (e) { b.notify(e.message); } }
async function start() { await b.start(); if (!b.error.value) await y.start(); }
async function setAppearance(event) { try { await appearance.set(event.target.value); } catch { b.notify('Appearance could not be saved.'); } }
function keyboard(event) { if (event.key === 'Escape') sidebar.value = false; if (event.key === '/' && !ideaOpen.value && !themeOpen.value && !ytOpen.value && !confirmation.value && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) { event.preventDefault(); search.value?.focus(); } }
onMounted(() => { start(); document.addEventListener('keydown', keyboard); });
onUnmounted(() => document.removeEventListener('keydown', keyboard));
</script>
<template>
  <div class="mobile-backdrop" :class="{ 'is-open': sidebar }" @click="sidebar = false"></div>
  <aside class="sidebar" :class="{ 'is-open': sidebar }" aria-label="Workspace navigation"><div class="workspace"><span class="workspace-mark" aria-hidden="true">CB</span><div>Cueboard<div class="workspace-sub">Creator workspace</div></div></div><nav aria-label="Board views"><button class="nav-item" :class="{ 'is-current': !filter }" @click="filterTo('')"><AppIcon name="board" />Content board<span class="count">{{ board.ideas.length }}</span></button></nav><div class="section-label themes-label"><span>THEMES</span><button aria-label="New theme" :disabled="loading || busy || !!error" @click="openTheme()">+</button></div><nav class="theme-nav" aria-label="Themes"><button v-for="t in board.themes" :key="t.id" class="nav-item" :class="{ 'is-current': filter === t.id }" @click="filterTo(t.id)"><span class="theme-dot" :style="{ '--dot': t.color }"></span>{{ t.name }}<span class="count">{{ board.ideas.filter(i => i.theme === t.id).length }}</span></button></nav>
  <PostingCalendar :cache="y.cache.value" :busy="y.busy.value" @refresh="y.ready.value ? y.refresh() : ytOpen = true" />
  <div class="sidebar-footer"><div class="storage-state"><span class="theme-dot"></span><span>{{ loading ? 'Opening IndexedDB...' : error ? 'Storage needs attention' : 'Saved in this browser · IndexedDB' }}</span></div><p>Your progress stays on this device.<br>Export a backup to keep a copy.</p><button class="restore-button" :disabled="loading || busy" @click="importFile.click()">Restore a backup</button><input ref="importFile" class="visually-hidden" type="file" accept=".json,application/json" aria-label="Choose a board backup" @change="restore"></div></aside>
  <main class="main"><header class="topbar"><div class="breadcrumb"><button class="mobile-menu" aria-label="Open workspace navigation" @click="sidebar = true"><AppIcon name="menu" /></button><span>Workspace</span><span class="slash">/</span><span class="current">Content board</span></div><div class="topbar-actions"><span class="top-meta"><AppIcon name="lock" />Personal workspace</span><label class="appearance-control"><AppIcon name="appearance" /><span class="visually-hidden">Appearance</span><select :value="appearance.preference.value" @change="setAppearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div></header>
  <div class="page"><section class="page-heading"><div><h1>Content board</h1><p class="intro">A home for every theme, the next idea, and everything already made.</p></div><div class="heading-actions"><button class="btn btn-quiet" :disabled="loading || !!error" @click="ytOpen = true">{{ y.label.value }}</button><button class="btn btn-quiet" :disabled="loading" @click="download"><AppIcon name="export" />Export backup</button><button class="btn btn-primary" :disabled="loading || busy || !!error" @click="openIdea()"><AppIcon name="plus" />New idea</button></div></section>
  <p v-if="loading" role="status">Opening your board...</p><div v-if="error" class="save-error is-visible" role="alert">{{ error }} <button @click="start">Retry storage</button></div>
  <template v-if="!loading"><div class="summary-line"><span><strong>{{ board.ideas.length }}</strong> {{ board.ideas.length === 1 ? 'idea' : 'ideas' }}</span><span class="summary-dot"></span><span><strong>{{ board.themes.length }}</strong> {{ board.themes.length === 1 ? 'theme' : 'themes' }}</span><span class="summary-dot"></span><button class="summary-completed" @click="showDone = true; doneDivider?.scrollIntoView({ behavior: 'smooth' })"><strong>{{ completed }}</strong> completed<AppIcon name="chevron" /></button></div>
  <div v-if="b.hasDemo.value" class="demo-notice"><span class="demo-dot"></span><span>Sample board. Edit a card or add your own theme to get started.</span><button :disabled="busy" @click="removeDemo">Start empty</button></div>
  <section v-if="!board.themes.length && !error" class="empty-board"><h2>Your next idea starts here.</h2><p>Create a theme, then add your first idea.</p><button class="btn btn-primary" @click="openTheme()">Create a theme</button></section>
  <section v-if="board.themes.length" aria-label="Ideas grouped by theme"><div class="toolbar"><span class="view-tab"><AppIcon name="board" />Board view</span><span class="group-label"><AppIcon name="layers" />Grouped by theme</span><div class="toolbar-right"><span v-if="filter" class="filter-pill">One theme<button aria-label="Show all themes" @click="filter = ''">×</button></span><label class="search-box"><AppIcon name="search" /><span class="visually-hidden">Search ideas</span><input ref="search" v-model="query" type="search" placeholder="Find an idea..."></label></div></div><p v-if="themes.length > 1" class="mobile-hint">Scroll sideways to explore the themes.</p>
  <div class="board-scroll" :class="{ 'single-theme': themes.length === 1 }"><div class="board-inner" :style="{ '--columns': themes.length }"><div class="theme-grid theme-headings"><div v-for="t in themes" :key="t.id"><div class="theme-heading-top"><span class="theme-dot" :style="{ '--dot': t.color }"></span><h2 class="theme-name" :style="{ '--tint': t.tint, '--tone': t.tone }">{{ t.name }}</h2><button class="theme-edit" :aria-label="'Edit theme ' + t.name" @click="openTheme(t)">Edit</button><button class="theme-add" :aria-label="'Add idea to ' + t.name" @click="openIdea(null, t.id)">+</button></div><p class="theme-description">{{ t.description }}</p></div></div>
  <div class="theme-grid active-grid" aria-label="Ideas to work on"><div v-for="t in themes" :key="t.id" class="column"><IdeaCard v-for="i in items(t.id)" :key="i.id" :idea="i" :cache="y.cache.value" :disabled="busy" @open="openIdea" @toggle="b.toggle" /><div v-if="!items(t.id).length" class="empty-column"><strong>{{ query ? 'No matching ideas' : 'A little room for what comes next.' }}</strong>{{ query ? 'Try a different search.' : 'Your next idea can start here.' }}</div><button class="add-card" :disabled="busy" @click="openIdea(null, t.id)"><AppIcon name="plus" />Add an idea</button></div></div>
  <div ref="doneDivider" class="done-divider"><AppIcon name="check" /><span class="done-label">Completed</span><span class="done-count">{{ completed }}</span><span class="done-copy">Finished ideas live down here.</span><button :aria-expanded="showDone" @click="showDone = !showDone">{{ showDone ? 'Hide' : 'Show' }}<AppIcon name="chevron" /></button></div>
  <div v-if="showDone" id="completed-ideas" class="theme-grid done-grid" aria-label="Completed ideas"><div v-for="t in themes" :key="t.id" class="column"><IdeaCard v-for="(i, index) in completedItems(t.id)" :key="i.id" :class="{ 'is-completed-preview': isCompletedPreview(t.id, index) }" :idea="i" :cache="y.cache.value" :disabled="busy" @open="openIdea" @toggle="b.toggle" /><div v-if="!items(t.id, true).length" class="done-empty">{{ searching ? 'No matching completed ideas.' : 'No completed ideas yet.' }}</div></div></div></div></div>
  <div v-if="showDone && !searching && completedOverflow" class="completed-more"><button class="btn completed-more-button" aria-controls="completed-ideas" :aria-expanded="allCompleted" @click="allCompleted = !allCompleted">{{ allCompleted ? 'Show fewer completed' : 'View all completed' }}<span v-if="!allCompleted" class="completed-more-count">{{ completedOverflow }} more</span><AppIcon name="chevron" /></button></div>
  </section>
  <footer class="board-footnote"><span><AppIcon name="check" />Check a card to move it below the divider. Click a card for details.</span><a href="./guide/" class="board-guide">Getting started</a><button class="text-danger" :disabled="busy || !b.hasDemo.value" @click="removeDemo">Remove demo data</button></footer></template></div></main>
  <IdeaEditor :open="ideaOpen" :idea="editingIdea" :theme-id="newThemeId" :themes="board.themes" :busy="busy" :cache="y.cache.value" :stamp="y.stamp.value" @close="ideaOpen = false" @save="saveIdea" @delete="deleteIdea" />
  <ThemeEditor :open="themeOpen" :theme="editingTheme" :busy="busy" :count="board.ideas.filter(i => i.theme === editingTheme?.id).length" @close="themeOpen = false" @save="saveTheme" @delete="deleteTheme" />
  <ModalDialog :open="!!confirmation" :title="confirmation?.title" @close="confirmation = null"><div class="dialog-content"><p class="detail-value">{{ confirmation?.text }}</p></div><div class="dialog-footer"><button class="btn btn-quiet" @click="confirmation = null">Cancel</button><button class="btn btn-primary" @click="confirm">{{ confirmation?.title }}</button></div></ModalDialog>
  <YouTubeSettings :open="ytOpen" :youtube="y" @close="ytOpen = false" />
  <div class="toast" :class="{ visible: message }" role="status" aria-live="polite"><span>{{ message }}</span><button v-if="b.undo.value" :disabled="busy" @click="b.undoLast">Undo</button></div>
</template>
