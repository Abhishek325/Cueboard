export function setupAboutDialog(root = document) {
  const dialog = root.querySelector('#cueboard-about');
  if (!dialog || typeof dialog.showModal !== 'function') return () => {};
  const closeButton = dialog.querySelector('[data-about-close]');
  let opener = null;
  function open(event) {
    const link = event.target.closest?.('[data-about-open]');
    if (!link || event.defaultPrevented) return;
    // Preserve ordinary open-in-new-tab behaviour and the no-JavaScript About page.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = link;
    dialog.showModal();
    root.documentElement.classList.add('about-is-open');
  }
  function close() { dialog.close(); }
  function closed() {
    root.documentElement.classList.remove('about-is-open');
    if (opener?.isConnected) opener.focus();
    opener = null;
  }
  function backdrop(event) {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }
  // Vue can mount or replace the topbar link after this helper is initialized.
  root.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', backdrop);
  dialog.addEventListener('close', closed);
  return () => { if (dialog.open) close(); closed(); root.removeEventListener('click', open); closeButton.removeEventListener('click', close); dialog.removeEventListener('click', backdrop); dialog.removeEventListener('close', closed); };
}
