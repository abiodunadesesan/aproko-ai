# Aproko Live Context — Browser Extensions (Sprint 29)

Manifest V3 companion that captures the **active tab** and asks the Aproko web app about it.

| Browser | Package folder |
| --- | --- |
| Chrome / Edge | `apps/extension/extension` |
| Safari | `apps/extension/safari` (see that folder’s README) |

## Load in Chrome

1. Start the web app (`pnpm --filter @aproko/web dev`) and sign in at `http://localhost:3000`.
2. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked**.
3. Select this folder:

```text
apps/extension/extension
```

4. Open the side panel (extension action) → Settings → set **Web app URL** to your app origin.
5. Press **Ctrl/Cmd+Shift+Y** on an http(s) page to capture (toolbar badge shows `1`).
6. Click the **Aproko toolbar icon** to open the side panel (Chrome only allows open on icon click).
7. Ask in the embedded panel.

## Load in Safari

```bash
pnpm --filter @aproko/extension sync:safari
```

Then follow `apps/extension/safari/README.md` (Xcode converter + Safari Extensions settings).

## How auth works

Clerk cookies **do not** reach the extension iframe (`chrome-extension://` /
`safari-web-extension://`). Sign in on a **normal Aproko tab**, then use
**Open connect checklist**. That page mints a short-lived handoff token. The extension
stores it and Ask sends `Authorization: Bearer ext.<token>` to
`/api/v1/extension/live-context/chat` (or the `/api/chat` alias).

If Ask says Unauthorized, reconnect from a full tab — do not try Google sign-in inside
the panel.

## Cursor tracking + click-to-solve (v0.3+)

- Hover tip follows the **mouse cursor** (not the bottom-right chip).
- Side panel **Cursor focus** shows a structured card (element type + primary text).
- **Page snapshot** summarizes what the page is about (filters nav chrome).
- **Alt/Option-click** a question: extension reads full page + clicked text, calls
  `POST /api/v1/workspaces/{id}/live-context/solve`, then:
  - MCQ → highlights / selects the best option
  - Short answer → fills the nearest text field when possible
- Stay signed in and complete connect handoff so background `fetch` has a bearer token.

## API

`POST /api/v1/workspaces/{workspaceId}/live-context/chat`

Body:

```json
{
  "url": "https://example.com",
  "title": "Example",
  "pageText": "…",
  "capturedAt": "2026-08-16T08:00:00.000Z",
  "userQuery": "Summarize the key claims"
}
```

Streams SSE (`start` / `delta` / `done` / `error`), same family as workspace chat.

## Custom domains

`host_permissions` in `manifest.json` currently allow:

- `http://localhost:3000/*`
- `http://127.0.0.1:3000/*`
- `https://aprokoai.vercel.app/*`

Add your preview/custom origin there before pointing Settings at it.

## Chrome Web Store (publish first)

1. Clear production gates in `docs/12-backlog/chrome-web-store-submission-runbook.md`
2. Build upload ZIP:

```bash
pnpm --filter @aproko/extension pack:chrome
```

3. Upload `apps/extension/dist/aproko-live-context-chrome-v*.zip` in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Listing copy: `apps/extension/STORE_LISTING.md`

## Docs

- Chrome submit runbook: `docs/12-backlog/chrome-web-store-submission-runbook.md`
- Architecture: `docs/02-architecture/04-browser-extension-companion-v2.md`
- Backlog: `docs/12-backlog/sprint-29-browser-extension-v2.md`
- Connect UI: `/extension/connect` · Live dashboard: `/extension/live`
