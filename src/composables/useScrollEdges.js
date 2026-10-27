import { ref, watch, onScopeDispose } from 'vue';

export function useScrollEdges(element) {
  const canScrollLeft = ref(false), canScrollRight = ref(false);
  let cleanup = () => {};
  function update() {
    const el = element.value;
    canScrollLeft.value = !!el && el.scrollLeft > 1;
    canScrollRight.value = !!el && el.scrollWidth - el.clientWidth - el.scrollLeft > 1;
  }
  watch(element, el => {
    cleanup();
    if (!el) { update(); return; }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener('scroll', update, { passive: true });
    cleanup = () => { observer.disconnect(); el.removeEventListener('scroll', update); };
    update();
  }, { flush: 'post', immediate: true });
  function scroll(direction) {
    const el = element.value;
    if (!el) return;
    const columns = el.querySelectorAll('.active-grid > .theme-section');
    const step = columns.length > 1 ? columns[1].offsetLeft - columns[0].offsetLeft : el.clientWidth * .8;
    el.scrollBy({ left: direction * Math.max(1, step), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  onScopeDispose(() => cleanup());
  return { canScrollLeft, canScrollRight, scroll };
}
