/** True when the page is rendered inside the extension panel iframe. */
export function isExtensionEmbedFrame(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.self !== window.top;
}

/** Open a URL in a normal browser tab (never navigate the extension iframe). */
export function openInExtensionBrowserTab(url: string): void {
  globalThis.open?.(url, '_blank', 'noopener,noreferrer');
}
