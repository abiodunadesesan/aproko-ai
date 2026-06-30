# Sprint 11 - Search Shortcuts

## Status

- **Current ticket:** `SEARCH-004`
- **State:** Done

## Ticket: SEARCH-004 - Global Search Shortcut

### Product Spec

Users can open workspace search instantly from any authenticated page using a global keyboard shortcut.

### Scope

- Implement global `Cmd/Ctrl + K` shortcut in app shell.
- Ignore shortcut when user is typing in inputs/textareas/contenteditable fields.
- Replace shell shortcut placeholder button with active "Open Search" action.
- Add utility-level shortcut tests for deterministic shortcut behavior.

### Acceptance Criteria

- On authenticated pages, pressing `Cmd/Ctrl + K` navigates to `/search`.
- Shortcut does not trigger while typing in form fields.
- Header shortcut button opens Search.
- Tests cover shortcut predicate behavior.

### Definition of Done

- Shortcut logic shipped in reusable utility.
- App shell integrated with global key listener.
- Automated tests pass in lint/typecheck/unit/e2e.

### Artifacts

- `apps/web/lib/navigation/shortcuts.ts`
- `apps/web/lib/navigation/shortcuts.test.ts`
- `apps/web/components/app-shell.tsx`
- `apps/web/e2e/smoke.spec.ts`
