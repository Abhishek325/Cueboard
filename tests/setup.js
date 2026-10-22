import 'fake-indexeddb/auto';
import { vi } from 'vitest';
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn(query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) });
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
Element.prototype.scrollIntoView = function () {};
