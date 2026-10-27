import { afterEach, expect, test, vi } from 'vitest';
import { setupAboutDialog } from '../src/lib/about-dialog.js';

// Observe the helper before preventing Happy DOM from navigating the test window.
function dispatchClick(target, event) {
  let prevented;
  window.addEventListener('click', e => { prevented = e.defaultPrevented; e.preventDefault(); }, { once: true });
  target.dispatchEvent(event);
  return prevented;
}

let cleanup;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
  document.documentElement.classList.remove('about-is-open');
});

test('About works for dynamically mounted and replaced topbar links and returns focus', () => {
  document.body.innerHTML = '<dialog id="slateory-about"><button data-about-close>Close</button></dialog><header></header>';
  const dialog = document.querySelector('dialog');
  dialog.showModal = vi.fn(() => { dialog.open = true; });
  dialog.close = vi.fn(() => { dialog.open = false; dialog.dispatchEvent(new Event('close')); });
  cleanup = setupAboutDialog();
  const header = document.querySelector('header');
  function mountLink() {
    header.innerHTML = '<a href="./about/" data-about-open><span>About Slateory</span></a>';
    return header.querySelector('a');
  }
  let link = mountLink();
  const click = () => new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  let event = click();
  expect(dispatchClick(link.querySelector('span'), event)).toBe(true);
  expect(dialog.showModal).toHaveBeenCalledOnce();
  expect(document.documentElement.classList.contains('about-is-open')).toBe(true);
  dialog.querySelector('button').click();
  expect(document.activeElement).toBe(link);
  expect(document.documentElement.classList.contains('about-is-open')).toBe(false);

  link = mountLink();
  event = click();
  dispatchClick(link, event);
  expect(dialog.showModal).toHaveBeenCalledTimes(2);
  // Escape is handled by the native dialog, which emits close.
  dialog.close();
  expect(document.activeElement).toBe(link);
  cleanup();
  cleanup = null;
  expect(dispatchClick(link, click())).toBe(false);
  expect(dialog.showModal).toHaveBeenCalledTimes(2);
});

test('modified clicks and unsupported dialogs keep the ordinary About-page fallback', () => {
  document.body.innerHTML = '<a href="./about/" data-about-open>About</a><dialog id="slateory-about"><button data-about-close>Close</button></dialog>';
  const dialog = document.querySelector('dialog');
  const link = document.querySelector('a');
  dialog.showModal = vi.fn();
  cleanup = setupAboutDialog();
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...options });
    expect(dispatchClick(link, event)).toBe(false);
  }
  link.target = '_blank';
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  expect(dispatchClick(link, event)).toBe(false);
  expect(dialog.showModal).not.toHaveBeenCalled();
  cleanup();
  dialog.showModal = undefined;
  cleanup = setupAboutDialog();
  link.removeAttribute('target');
  expect(dispatchClick(link, new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
});
