import { ref, shallowRef, computed, onScopeDispose, nextTick } from 'vue';
import { liveQuery } from 'dexie';
import { createProjectStore } from '../services/projects.js';
export function useProjects(store = createProjectStore()) {
  const projects = ref([]), activeId = ref('default'), projectRepository = shallowRef(null);
  const loading = ref(true), busy = ref(false), error = ref('');
  const active = computed(() => projects.value.find(p => p.id === activeId.value));
  let subscription, disposed = false;
  async function start() {
    loading.value = true; error.value = '';
    try {
      await store.initialize();
      const [all, chosen] = await Promise.all([store.list(), store.current()]);
      if (disposed) return;
      const repo = store.forProject(chosen.id); await repo.open();
      if (disposed) return;
      projects.value = all; activeId.value = chosen.id; projectRepository.value = repo;
      subscription?.unsubscribe();
      subscription = liveQuery(() => store.list()).subscribe({ next: value => { if (!disposed) projects.value = value; }, error: e => { error.value = e.message; } });
    } catch (e) { error.value = 'Could not open projects. ' + e.message; }
    finally { if (!disposed) loading.value = false; }
  }
  async function switchProject(id) {
    if (busy.value || id === activeId.value) return;
    busy.value = true; error.value = '';
    try {
      if (!projects.value.some(p => p.id === id)) throw Error('That project is unavailable.');
      const repo = store.forProject(id); await repo.open(); await store.select(id);
      if (disposed) return;
      activeId.value = id; projectRepository.value = repo;
    } catch (e) { error.value = 'Could not switch projects. ' + e.message; }
    finally { if (!disposed) busy.value = false; }
  }
  async function save(name, id) {
    if (busy.value) return false;
    busy.value = true; error.value = '';
    try {
      const project = id ? await store.rename(id, name) : await store.create(name);
      const repo = store.forProject(project.id); await repo.open();
      if (!id) await store.select(project.id);
      if (disposed) return false;
      const all = await store.list();
      if (disposed) return false;
      projects.value = all;
      if (!id) { activeId.value = project.id; projectRepository.value = repo; }
      return true;
    } catch (e) { error.value = e.message; return false; }
    finally { if (!disposed) busy.value = false; }
  }
  async function remove() {
    if (busy.value) return false;
    busy.value = true; error.value = '';
    const previous = projectRepository.value;
    // Unmount the old board before clearing content so requests and Undo cannot revive it.
    projectRepository.value = null;
    await nextTick();
    try {
      const next = await store.remove(activeId.value);
      const repo = store.forProject(next.id); await repo.open();
      const all = await store.list();
      if (disposed) return false;
      projects.value = all; activeId.value = next.id; projectRepository.value = repo;
      return true;
    } catch (e) { if (!disposed) { error.value = 'Could not delete project. ' + e.message; projectRepository.value = previous; } return false; }
    finally { if (!disposed) busy.value = false; }
  }
  onScopeDispose(() => { disposed = true; subscription?.unsubscribe(); store.close(); });
  return { projects, activeId, active, projectRepository, loading, busy, error, start, switchProject, save, remove };
}
