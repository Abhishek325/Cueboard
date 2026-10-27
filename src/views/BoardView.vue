<script setup>
import { computed, ref, onMounted, onUnmounted, inject, watch, nextTick } from 'vue';
import { useBoard } from '../composables/useBoard.js';
import { useScrollEdges } from '../composables/useScrollEdges.js';
import { useYoutube } from '../composables/useYoutube.js';
import { validate } from '../lib/board.js';
import AppIcon from '../components/AppIcon.vue';
import PostingCalendar from '../components/PostingCalendar.vue';
import IdeaCard from '../components/IdeaCard.vue';
import ReorderControl from '../components/ReorderControl.vue';
import IdeaEditor from '../components/IdeaEditor.vue';
import ThemeEditor from '../components/ThemeEditor.vue';
import ThemeFilter from '../components/ThemeFilter.vue';
import ProjectSwitcher from '../components/ProjectSwitcher.vue';
import ProjectHeading from '../components/ProjectHeading.vue';
import { DEFAULT_PROJECT } from '../services/projects.js';
import ModalDialog from '../components/ModalDialog.vue';
import YouTubeSettings from '../components/YouTubeSettings.vue';
const props = defineProps({ repo: Object, project: Object, projects: Array, projectBusy: Boolean, projectError: String });
defineEmits(['switch-project', 'create-project', 'rename-project', 'delete-project']);
const currentProject = computed(() => props.project || DEFAULT_PROJECT);
const appearance = inject('appearance');
let workspaceAlive = true;
const boardScroller = ref(null);
const { canScrollLeft, canScrollRight, scroll: scrollThemes } = useScrollEdges(boardScroller);
const b = useBoard(props.repo), y = useYoutube(() => b.board.value.ideas, props.repo);
const selectedThemes = ref(null), query = ref(''), showDone = ref(true), sidebar = ref(false), ideaOpen = ref(false), themeOpen = ref(false), ytOpen = ref(false);
const editingIdea = ref(null), editingTheme = ref(null), newThemeId = ref(''), confirmation = ref(null), search = ref(null), doneDivider = ref(null), importFile = ref(null);
const board = b.board, loading = b.loading, busy = b.busy, error = b.error, message = b.message;
const themes = computed(() => board.value.themes.filter(t => selectedThemes.value === null || selectedThemes.value.includes(t.id)));
watch(() => board.value.themes, values => {
  if (selectedThemes.value === null) return;
  const valid = selectedThemes.value.filter(id => values.some(t => t.id === id));
  selectedThemes.value = selectedThemes.value.length && !valid.length ? null : valid;
});
const hasIdeas = computed(() => board.value.ideas.length > 0);
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
const dragging = ref(null), dropTarget = ref(null);
function ideaPeers(idea) { return items(idea.theme, idea.status === 'done').filter(i => i.status === idea.status); }
function canMoveIdea(idea, direction) { const peers = ideaPeers(idea), index = peers.findIndex(i => i.id === idea.id); return index >= 0 && !!peers[index + direction]; }
async function focusHandle(kind, id) { await nextTick(); boardScroller.value?.querySelector(kind === 'theme' ? `.active-grid [data-theme="${id}"] .reorder-handle` : `[data-idea-id="${id}"] .reorder-handle`)?.focus({ preventScroll: true }); }
async function moveTheme(theme, direction) {
  const index = board.value.themes.findIndex(t => t.id === theme.id), target = board.value.themes[index + direction];
  if (target && await b.reorderTheme(theme.id, target.id, direction > 0)) await focusHandle('theme', theme.id);
}
async function moveIdea(idea, direction) {
  const peers = ideaPeers(idea), target = peers[peers.findIndex(i => i.id === idea.id) + direction];
  if (idea.status === 'done' && target) allCompleted.value = true;
  if (target && await b.reorderIdea(idea.id, target.id, direction > 0)) await focusHandle('idea', idea.id);
}
function clearDrag() { dragging.value = null; dropTarget.value = null; }
function startDrag(kind, id, event) {
  if (busy.value) { event.preventDefault(); return; }
  dragging.value = { kind, id }; dropTarget.value = null;
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); }
}
function eligible(kind, item) {
  if (!dragging.value || dragging.value.kind !== kind || dragging.value.id === item.id || busy.value) return false;
  if (kind === 'theme') return true;
  const source = board.value.ideas.find(i => i.id === dragging.value.id);
  return source?.theme === item.theme && source.status === item.status;
}
function over(kind, item, event) {
  if (!eligible(kind, item)) { if (dragging.value?.kind === kind) dropTarget.value = null; return; }
  event.preventDefault(); event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  const rect = event.currentTarget.getBoundingClientRect();
  const after = kind === 'theme' ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2;
  dropTarget.value = { kind, id: item.id, after };
  const scroller = boardScroller.value, bounds = scroller?.getBoundingClientRect();
  if (bounds?.width && event.clientX < bounds.left + 36) scroller.scrollBy({ left: -24 });
  else if (bounds?.width && event.clientX > bounds.right - 36) scroller.scrollBy({ left: 24 });
}
async function drop(kind, item, event) {
  if (!eligible(kind, item)) return;
  event.preventDefault(); event.stopPropagation();
  const id = dragging.value.id, after = dropTarget.value?.kind === kind && dropTarget.value?.id === item.id ? dropTarget.value.after : false;
  clearDrag();
  if (kind === 'theme') await b.reorderTheme(id, item.id, after);
  else await b.reorderIdea(id, item.id, after);
}
function dropClass(kind, id) {
  return { 'is-reordering': dragging.value?.kind === kind && dragging.value.id === id, 'drop-before': dropTarget.value?.kind === kind && dropTarget.value.id === id && !dropTarget.value.after, 'drop-after': dropTarget.value?.kind === kind && dropTarget.value.id === id && dropTarget.value.after };
}
function openTheme(theme = null) { editingTheme.value = theme; themeOpen.value = true; }
function openIdea(idea = null, themeId = '') { if (!board.value.themes.length) { openTheme(); b.notify('Create a theme for your first idea.'); return; } editingIdea.value = idea; newThemeId.value = themeId || themes.value[0]?.id || ''; ideaOpen.value = true; }
async function saveTheme(form) { if (await b.saveTheme(form)) { if (!form.id && selectedThemes.value !== null) selectedThemes.value = [...selectedThemes.value, board.value.themes.at(-1).id]; themeOpen.value = false; } }
async function saveIdea(form) { if (await b.saveIdea(form)) ideaOpen.value = false; }
function ask(title, text, action) { confirmation.value = { title, text, action }; }
function deleteTheme(theme) { themeOpen.value = false; ask('Delete theme', 'Delete this theme and all its ideas? You can Undo this change.', () => b.deleteTheme(theme.id)); }
function deleteIdea(idea) { ideaOpen.value = false; ask('Delete idea', 'Delete this idea? You can Undo this change.', () => b.deleteIdea(idea.id)); }
function removeDemo() { ask('Remove demo data', 'Remove sample ideas and unused sample themes? Your content, including sample cards you edited and saved, will stay. You can Undo this change.', () => b.removeDemo()); }
async function confirm() { const action = confirmation.value?.action; confirmation.value = null; if (action) await action(); }
function showAllThemes() { selectedThemes.value = null; sidebar.value = false; }
function download() { const blob = new Blob([JSON.stringify({ ...board.value, projectName: currentProject.value.name, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = (currentProject.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'content-board') + '-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
async function restore(event) { const file = event.target.files[0]; event.target.value = ''; if (!file) return; try { if (file.size > 3000000) throw Error('Choose a board backup smaller than 3 MB.'); const data = JSON.parse(await file.text()); if (!validate(data)) throw Error('That file is not a valid board backup.'); ask('Restore board backup', 'Replace the board in “' + currentProject.value.name + '” with ' + data.ideas.length + ' ideas across ' + data.themes.length + ' themes? Export the current board first if you want to keep it.', async () => { if (await b.restore(data)) { selectedThemes.value = null; query.value = ''; } }); } catch (e) { b.notify(e.message); } }
async function start() { await b.start(); if (workspaceAlive && !b.error.value) await y.start(); }
async function setAppearance(event) { try { await appearance.set(event.target.value); } catch { b.notify('Appearance could not be saved.'); } }
function keyboard(event) { if (event.key === 'Escape') { sidebar.value = false; clearDrag(); } if (event.key === '/' && !ideaOpen.value && !themeOpen.value && !ytOpen.value && !confirmation.value && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) { event.preventDefault(); search.value?.focus(); } }
onMounted(() => { start(); document.addEventListener('keydown', keyboard); });
onUnmounted(() => { workspaceAlive = false; document.removeEventListener('keydown', keyboard); });
</script>
<template>
  <div class="mobile-backdrop" :class="{ 'is-open': sidebar }" @click="sidebar = false"></div>
  <aside class="sidebar" :class="{ 'is-open': sidebar }" aria-label="Workspace navigation"><div class="workspace"><span class="workspace-mark" aria-hidden="true">CB</span><div>Cueboard<div class="workspace-sub">Creator workspace</div></div></div><nav aria-label="Projects"><ProjectSwitcher :projects="projects || [currentProject]" :active-id="currentProject.id" :count="board.ideas.length" :disabled="loading || busy || projectBusy" @switch="$emit('switch-project', $event)" @create="$emit('create-project')" /></nav>
  <PostingCalendar v-if="!loading && hasIdeas" :cache="y.cache.value" :busy="y.busy.value" @setup="ytOpen = true" @refresh="y.ready.value ? y.refresh() : ytOpen = true" />
  <div class="sidebar-footer"><p>Your progress stays on this device.<br>Export a backup to keep a copy.</p><button class="restore-button" :disabled="loading || busy" @click="importFile.click()">Restore a backup</button><input ref="importFile" class="visually-hidden" type="file" accept=".json,application/json" aria-label="Choose a board backup" @change="restore"></div></aside>
  <main class="main"><header class="topbar"><div class="breadcrumb"><button class="mobile-menu" aria-label="Open workspace navigation" @click="sidebar = true"><AppIcon name="menu" /></button><span>Workspace</span><span class="slash">/</span><span class="current">{{ currentProject.name }}</span></div><div class="topbar-actions"><a class="about-link" href="./about/" data-about-open aria-haspopup="dialog" aria-controls="cueboard-about">About Cueboard</a><label class="appearance-control"><AppIcon name="appearance" /><span class="visually-hidden">Appearance</span><select :value="appearance.preference.value" @change="setAppearance"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div></header>
  <div class="page"><section class="page-heading"><div><ProjectHeading :name="currentProject.name" :disabled="projectBusy || loading || busy" @rename="$emit('rename-project', $event)" @delete="$emit('delete-project')" /><p class="intro">A home for every theme, the next idea, and everything already made.</p></div><div class="heading-actions"><button v-if="!loading && (board.themes.length || hasIdeas)" class="btn btn-quiet" @click="download"><AppIcon name="export" />Export backup</button><button class="btn btn-primary" :disabled="loading || busy || !!error" @click="openIdea()"><AppIcon name="plus" />New idea</button></div></section>
  <p v-if="projectError" class="project-error" role="alert">{{ projectError }}</p>
  <p v-if="loading" role="status">Opening your board...</p><div v-if="error" class="save-error is-visible" role="alert">{{ error }} <button @click="start">Retry storage</button></div>
  <template v-if="!loading"><div class="summary-line"><span><strong>{{ board.ideas.length }}</strong> {{ board.ideas.length === 1 ? 'idea' : 'ideas' }}</span><span class="summary-dot"></span><span><strong>{{ board.themes.length }}</strong> {{ board.themes.length === 1 ? 'theme' : 'themes' }}</span><span class="summary-dot"></span><button class="summary-completed" @click="showDone = true; doneDivider?.scrollIntoView({ behavior: 'smooth' })"><strong>{{ completed }}</strong> completed<AppIcon name="chevron" /></button></div>
  <div v-if="b.hasDemo.value" class="demo-notice"><span class="demo-dot"></span><span>Sample board. Edit a card or add your own theme to get started.</span><button :disabled="busy" @click="removeDemo">Start empty</button></div>
  <section v-if="!hasIdeas && !error" class="empty-board"><h2>Your next idea starts here.</h2><p>{{ board.themes.length ? 'Add an idea to an existing theme, or create a new one.' : 'Create a theme, then add your first idea.' }}</p><div class="empty-board-actions"><button class="btn btn-primary" :disabled="busy" @click="openTheme()">Create a theme</button><button class="btn btn-quiet" :disabled="busy" @click="importFile.click()">Restore backup</button></div></section>
  <section v-if="board.themes.length" class="board-view" aria-label="Ideas grouped by theme"><div class="toolbar"><span class="view-tab"><AppIcon name="board" />Board view</span><span class="group-label">Grouped by theme</span><div class="toolbar-right"><label class="search-box"><AppIcon name="search" /><span class="visually-hidden">Search ideas</span><input ref="search" v-model="query" type="search" placeholder="Find an idea..."></label><ThemeFilter v-model="selectedThemes" :themes="board.themes" :disabled="busy" @create="openTheme()" /></div></div>
  <p v-if="themes.length > 1" id="board-scroll-help" class="board-scroll-hint">Scroll horizontally to explore all themes.</p>
  <div v-if="!themes.length" class="empty-filter"><p>No themes selected.</p><button class="btn btn-quiet" @click="showAllThemes">Show all themes</button></div>
  <div v-if="themes.length" class="board-scroll-shell">
  <div ref="boardScroller" id="theme-board-scroll" class="board-layout" :class="{ 'is-single-theme': themes.length === 1 }" :style="{ '--theme-count': themes.length }" tabindex="0" role="region" aria-label="Scrollable theme board" :aria-describedby="themes.length > 1 ? 'board-scroll-help' : undefined"><div class="board-tracks">
    <div class="theme-row active-grid" aria-label="Ideas to work on">
      <section v-for="t in themes" :key="t.id" class="theme-section" :class="dropClass('theme', t.id)" :data-theme="t.id" :aria-label="t.name" @dragover="over('theme', t, $event)" @drop="drop('theme', t, $event)">
        <div class="theme-heading-top"><ReorderControl :label="'theme: ' + t.name" horizontal :disabled="busy" :can-previous="board.themes.findIndex(theme => theme.id === t.id) > 0" :can-next="board.themes.findIndex(theme => theme.id === t.id) < board.themes.length - 1" @start="startDrag('theme', t.id, $event)" @end="clearDrag" @move="moveTheme(t, $event)" /><span class="theme-dot" :style="{ '--dot': t.color }"></span><h2 class="theme-name" :style="{ '--tint': t.tint, '--tone': t.tone }">{{ t.name }}</h2><button class="theme-edit" :aria-label="'Edit theme ' + t.name" @click="openTheme(t)">Edit</button><button class="theme-add" :aria-label="'Add idea to ' + t.name" @click="openIdea(null, t.id)">+</button></div>
        <p class="theme-description">{{ t.description }}</p>
        <div class="column"><IdeaCard v-for="i in items(t.id)" :key="i.id" :class="dropClass('idea', i.id)" :idea="i" :cache="y.cache.value" :disabled="busy" :can-previous="canMoveIdea(i, -1)" :can-next="canMoveIdea(i, 1)" @reorder-start="startDrag('idea', i.id, $event)" @reorder-end="clearDrag" @move="moveIdea(i, $event)" @dragover="over('idea', i, $event)" @drop="drop('idea', i, $event)" @open="openIdea" @toggle="b.toggle" /><div v-if="!items(t.id).length" class="empty-column"><strong>{{ query ? 'No matching ideas' : 'A little room for what comes next.' }}</strong>{{ query ? 'Try a different search.' : 'Your next idea can start here.' }}</div><button class="add-card" :disabled="busy" @click="openIdea(null, t.id)"><AppIcon name="plus" />Add an idea</button></div>
      </section>
    </div>
    <div ref="doneDivider" class="done-divider"><AppIcon name="check" /><span class="done-label">Completed</span><span class="done-count">{{ completed }}</span><span class="done-copy">Finished ideas live down here.</span><button :aria-expanded="showDone" @click="showDone = !showDone">{{ showDone ? 'Hide' : 'Show' }}<AppIcon name="chevron" /></button></div>
    <div v-if="showDone" id="completed-ideas" class="theme-row done-grid" aria-label="Completed ideas">
      <section v-for="t in themes" :key="t.id" class="theme-section" :data-theme="t.id" :aria-label="t.name + ' completed ideas'">
        <h3 class="completed-theme-name"><span class="theme-dot" :style="{ '--dot': t.color }"></span>{{ t.name }}</h3>
        <div class="column"><IdeaCard v-for="(i, index) in completedItems(t.id)" :key="i.id" :class="[{ 'is-completed-preview': isCompletedPreview(t.id, index) }, dropClass('idea', i.id)]" :idea="i" :cache="y.cache.value" :disabled="busy" :can-previous="canMoveIdea(i, -1)" :can-next="canMoveIdea(i, 1)" @reorder-start="startDrag('idea', i.id, $event)" @reorder-end="clearDrag" @move="moveIdea(i, $event)" @dragover="over('idea', i, $event)" @drop="drop('idea', i, $event)" @open="openIdea" @toggle="b.toggle" /><div v-if="!items(t.id, true).length" class="done-empty">{{ searching ? 'No matching completed ideas.' : 'No completed ideas yet.' }}</div></div>
      </section>
    </div>
  </div></div>
  <div v-if="canScrollLeft" class="board-edge-cue is-left"><span class="board-edge-shade" aria-hidden="true"></span><button type="button" class="board-edge-button" aria-label="Show previous themes" aria-controls="theme-board-scroll" title="More themes to the left" @click="scrollThemes(-1)"><AppIcon name="arrow" /></button></div>
  <div v-if="canScrollRight" class="board-edge-cue is-right"><span class="board-edge-shade" aria-hidden="true"></span><button type="button" class="board-edge-button" aria-label="Show more themes" aria-controls="theme-board-scroll" title="More themes to the right" @click="scrollThemes(1)"><AppIcon name="arrow" /></button></div>
  </div>
  <div v-if="showDone && !searching && completedOverflow" class="completed-more"><button class="btn completed-more-button" aria-controls="completed-ideas" :aria-expanded="allCompleted" @click="allCompleted = !allCompleted">{{ allCompleted ? 'Show fewer completed' : 'View all completed' }}<span v-if="!allCompleted" class="completed-more-count">{{ completedOverflow }} more</span><AppIcon name="chevron" /></button></div>
  </section>
  <footer class="board-footnote"><span><AppIcon name="check" />Check a card to move it below the divider. Click a card for details.</span><a href="./guide/" class="board-guide">Getting started</a></footer></template></div></main>
  <IdeaEditor :open="ideaOpen" :idea="editingIdea" :theme-id="newThemeId" :themes="board.themes" :busy="busy" :cache="y.cache.value" :stamp="y.stamp.value" @close="ideaOpen = false" @save="saveIdea" @delete="deleteIdea" />
  <ThemeEditor :open="themeOpen" :theme="editingTheme" :busy="busy" :count="board.ideas.filter(i => i.theme === editingTheme?.id).length" @close="themeOpen = false" @save="saveTheme" @delete="deleteTheme" />
  <ModalDialog :open="!!confirmation" :title="confirmation?.title" @close="confirmation = null"><div class="dialog-content"><p class="detail-value">{{ confirmation?.text }}</p></div><div class="dialog-footer"><button class="btn btn-quiet" @click="confirmation = null">Cancel</button><button class="btn btn-primary" @click="confirm">{{ confirmation?.title }}</button></div></ModalDialog>
  <YouTubeSettings :open="ytOpen" :youtube="y" @close="ytOpen = false" />
  <div class="toast" :class="{ visible: message }" role="status" aria-live="polite"><span>{{ message }}</span><button v-if="b.undo.value" :disabled="busy" @click="b.undoLast">Undo</button></div>
</template>
