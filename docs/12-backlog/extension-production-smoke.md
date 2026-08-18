# Extension production smoke (v0.3.5)

Host: `https://aprokoai.vercel.app`  
Package: `apps/extension/extension` (Chrome) · `apps/extension/safari` (Safari)

This is a **manual** gate. Automated CI cannot click Capture in a real browser profile.

## 0) Deploy

1. Confirm `main` is on Vercel Production.
2. Privacy page loads: `https://aprokoai.vercel.app/privacy` (section **Browser extension (Live Context)**).
3. Unauthenticated `POST /api/chat` returns JSON `{ "error": "Unauthorized" }` (not an HTML sign-in page).
4. `OPTIONS /api/chat` from a `chrome-extension://` origin returns **204** after this release (CORS preflight). Until that deploy lands, OPTIONS may still be 401.

## 1) Chrome (unpacked, same files as store ZIP)

1. `chrome://extensions` → Developer mode → **Load unpacked** → `apps/extension/extension`.
2. Confirm version **0.3.5**.
3. Side panel → Settings → Web app URL = `https://aprokoai.vercel.app` → Save.
4. Open **Open connect checklist** in a **normal tab** (not the panel). Sign in. Refresh once.
5. Return to the panel → Reload panel (or close/reopen).
6. Open an https article or quiz.
7. **Capture tab** (or `Cmd/Ctrl+Shift+Y`) → Ask about this page works (not Unauthorized / body-stream error).
8. Hover readable text → Cursor Focus + Live Transcript feed update.
9. `Cmd/Ctrl+Shift+H` pins hover into Live Transcript (if unbound, set it in `chrome://extensions/shortcuts`).
10. Alt/Option-click a question → solve returns.
11. Uncheck **Enable cursor hover focus** → hover tip stops; Capture still works.
12. Chrome only: **Record tab audio** → Stop → transcript appears under `/transcripts` (needs Whisper key on Vercel). Not always-on.
13. Dashboard `/dashboard`: Chat / Flashcards / Quizzes / Presentations tabs; Record a lecture.

## 2) Safari

```bash
pnpm --filter @aproko/extension sync:safari
```

Rebuild the Xcode wrapper. Repeat connect → capture → Ask. There is **no** Record tab audio (no `tabCapture`).

## Pass / fail

| Check                              | Pass |
| ---------------------------------- | ---- |
| Connect handoff, then Ask in panel |      |
| Capture + hover + H shortcut       |      |
| Solve Alt-click                    |      |
| Privacy URL opens                  |      |
| Tab audio opt-in only (Chrome)     |      |
| Safari Ask without tabCapture      |      |

If Ask is Unauthorized after connect: confirm production includes `/api/v1/extension/*` middleware bypass + handoff mint on `/extension/connect`.

## Automated probe log (2026-08-18, production)

| Check                                                | Result                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `OPTIONS /api/chat` + `Origin: chrome-extension://…` | **204** + CORS headers                                       |
| `POST /api/chat` unauthenticated                     | **401** JSON                                                 |
| `GET /privacy`                                       | **200** — Browser extension, Record tab audio, connect token |
| `GET /extension/connect` / `/extension/live`         | **307** (auth redirect — expected)                           |
| `pnpm --filter @aproko/extension pack:chrome`        | **0.3.5** ZIP OK                                             |
| `verify-extension.mjs`                               | Chrome + Safari parity OK                                    |

Signed-in Capture → Ask, hover/H shortcuts, and Record tab audio still require manual pass in the owner browser profile.
