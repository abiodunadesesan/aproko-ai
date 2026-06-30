type ShortcutEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  target: unknown;
};

export function shouldOpenSearchFromShortcut(event: ShortcutEvent): boolean {
  if (!(event.metaKey || event.ctrlKey)) {
    return false;
  }

  if (event.key.toLowerCase() !== 'k') {
    return false;
  }

  const target = event.target as {
    tagName?: string;
    isContentEditable?: boolean;
  } | null;

  if (!target) {
    return true;
  }

  const tagName = target.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
    return false;
  }

  return true;
}
