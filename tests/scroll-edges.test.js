import { test, expect, vi } from 'vitest';
import { ref, effectScope, nextTick } from 'vue';
import { useScrollEdges } from '../src/composables/useScrollEdges.js';

test('scroll cues follow both edges, arrow movement, resizing and content removal', async () => {
  let resized;
  const disconnected = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { resized = callback; }
    observe() {}
    disconnect() { disconnected(); }
  });
  const scope = effectScope(), target = ref(null);
  const edges = scope.run(() => useScrollEdges(target));
  const el = document.createElement('div');
  el.innerHTML = '<div><div class="active-grid"><section class="theme-section"></section><section class="theme-section"></section></div></div>';
  Object.defineProperties(el, { clientWidth: { configurable: true, writable: true, value: 900 }, scrollWidth: { configurable: true, writable: true, value: 1500 } });
  const columns = el.querySelectorAll('section');
  Object.defineProperty(columns[0], 'offsetLeft', { value: 0 });
  Object.defineProperty(columns[1], 'offsetLeft', { value: 310 });
  el.scrollBy = vi.fn(({ left }) => {
    el.scrollLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + left));
    el.dispatchEvent(new Event('scroll'));
  });
  try {
    target.value = el; await nextTick();
    expect(edges.canScrollLeft.value).toBe(false);
    expect(edges.canScrollRight.value).toBe(true);
    edges.scroll(1);
    expect(el.scrollBy).toHaveBeenLastCalledWith({ left: 310, behavior: 'smooth' });
    expect(edges.canScrollLeft.value).toBe(true);
    expect(edges.canScrollRight.value).toBe(true);
    edges.scroll(1);
    expect(el.scrollLeft).toBe(600);
    expect(edges.canScrollLeft.value).toBe(true);
    expect(edges.canScrollRight.value).toBe(false);
    edges.scroll(-1);
    expect(edges.canScrollRight.value).toBe(true);
    el.scrollLeft = 0; el.clientWidth = 1500; resized();
    expect(edges.canScrollLeft.value).toBe(false);
    expect(edges.canScrollRight.value).toBe(false);
    el.clientWidth = 500; resized();
    expect(edges.canScrollRight.value).toBe(true);
    el.scrollWidth = 400; resized();
    expect(edges.canScrollRight.value).toBe(false);
    target.value = null; await nextTick();
    expect(disconnected).toHaveBeenCalledOnce();
    expect(edges.canScrollLeft.value).toBe(false);
    expect(edges.canScrollRight.value).toBe(false);
  } finally { scope.stop(); vi.unstubAllGlobals(); }
});
