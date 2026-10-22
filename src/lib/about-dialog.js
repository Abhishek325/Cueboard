export function setupAboutDialog(root = document) {
  const link = root.querySelector('[data-about-open]');
  const dialog = root.querySelector('#cueboard-about');
  if (!link || !dialog || typeof dialog.showModal !== 'function') return () => {};
  const closeButton = dialog.querySelector('[data-about-close]');
  function open(event) {
    // Preserve ordinary open-in-new-tab behaviour and the no-JavaScript About page.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    dialog.showModal();
    root.documentElement.classList.add('about-is-open');
  }
  function close() { dialog.close(); }
  function closed() { root.documentElement.classList.remove('about-is-open'); }
  function backdrop(event) {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }
  link.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', backdrop);
  dialog.addEventListener('close', closed);
  return () => { if (dialog.open) close(); closed(); link.removeEventListener('click', open); closeButton.removeEventListener('click', close); dialog.removeEventListener('click', backdrop); dialog.removeEventListener('close', closed); };
}
