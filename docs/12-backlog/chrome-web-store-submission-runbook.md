# Chrome Web Store — Submission Runbook (Aproko Live Context)

Status: **Chrome first** (Safari deferred until Xcode wrapper is ready)  
Package: `apps/extension/extension` (v0.3.5)  
Listing copy: `apps/extension/STORE_LISTING.md`  
Permissions: `docs/12-backlog/extension-store-permissions-justification.md`  
Privacy: `https://aprokoai.vercel.app/privacy` (must be live before submit)  
Production smoke: `docs/12-backlog/extension-production-smoke.md`

## 0) Blockers to clear first

**You can ship production + keep using Load unpacked without paying the CWS fee.** Payment is only required when you click **Submit for review** in the Developer Dashboard.

| Gate                   | Why                                                                      | Action                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Production web deploy  | `/extension/connect` and `/extension/live` must load for signed-in users | Fix CI/deploy (lockfile + lint), push `main`, confirm Vercel green                                                                        |
| Privacy policy live    | CWS requires a working privacy policy URL                                | Verify `/privacy` shows **Browser extension (Live Context)** section                                                                      |
| Backend keys on Vercel | Solve/chat need `GROQ_API_KEY` (or configured provider)                  | Set in Vercel Production env                                                                                                              |
| Clerk production       | Handoff token after sign-in on a **full tab**                            | Connect checklist mints `Bearer ext.`; cookies never reach the iframe                                                                     |
| Developer account      | Required to **publish** (not for local/unpacked testing)                 | [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — **$5 one-time fee (defer until ready to submit)** |

## 1) Pre-flight smoke (production)

Follow `docs/12-backlog/extension-production-smoke.md` (v0.3.5). Minimum:

1. Install unpacked from `apps/extension/extension` (same files as the ZIP).
2. Side panel → Settings → Web app URL = `https://aprokoai.vercel.app` → Save.
3. **Open connect checklist** in a normal tab → sign in → refresh once → return to the panel.
4. Open an https quiz/article page.
5. **Capture tab** (or Cmd/Ctrl+Shift+Y) → Ask about this page (not Unauthorized).
6. Hover + Cmd/Ctrl+Shift+H pin into Live Transcript.
7. **Alt/Option-click** a question → solve returns (not 401/404).
8. Uncheck **Enable cursor hover focus** → hover tip stops; capture/solve still work.
9. Chrome: **Record tab audio** start/stop (not always-on). Safari has no tab-audio control.
10. Confirm privacy link opens: `https://aprokoai.vercel.app/privacy`.

## 2) Build upload ZIP

From repo root:

```bash
pnpm --filter @aproko/extension pack:chrome
```

Output: `apps/extension/dist/aproko-live-context-chrome.zip`

Upload **only** the contents of `apps/extension/extension` (the script does this). Do not zip the repo root or `apps/extension` parent folder.

## 3) Developer Dashboard — create listing

1. Open [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. **New item** → Upload `aproko-live-context-chrome.zip`.
3. **Store listing** tab — paste from `apps/extension/STORE_LISTING.md`:
   - Name: **Aproko Live Context**
   - Summary: short description (≤132 chars for best display)
   - Description: full description
   - Category: **Productivity** or **Education** (pick one; stay consistent)
   - Language: English
4. **Graphic assets** (required):
   - Icon: 128×128 (use `apps/extension/extension/icons/icon128.png` or export higher-res brand icon)
   - Screenshots: at least **1**, recommended **1280×800** or **640×400** (see STORE_LISTING.md list)
   - Optional: small promo tile 440×280, marquee 1400×560
5. **Privacy** tab:
   - Privacy policy URL: `https://aprokoai.vercel.app/privacy`
   - Single purpose: _Help signed-in Aproko users ask questions about the webpage they are viewing using user-initiated capture and optional cursor focus._
6. **Distribution** tab:
   - Visibility: Public (or Unlisted for beta)
   - Regions: as needed

## 4) Privacy practices questionnaire (draft answers)

Use `docs/12-backlog/extension-store-permissions-justification.md` for detail. Summary for the dashboard:

| Question area                            | Answer                                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What user data do you collect?**       | Page text and URL when the user captures or Alt/Option-clicks; cursor snippet when hover is on or Cmd/Ctrl+Shift+H; Chrome tab audio only after Record/Stop; a short-lived connect token in extension storage (not Clerk cookies in the iframe). |
| **How is it used?**                      | To generate learning assistance (chat/solve) in the user’s Aproko workspace.                                                                                                                  |
| **Is data sold?**                        | No.                                                                                                                                                                                           |
| **Is data used for unrelated purposes?** | No — only to provide the extension feature tied to Aproko.                                                                                                                                    |
| **Where is data sent?**                  | Aproko API (`aprokoai.vercel.app` / configured app origin); AI provider for generation when user triggers chat/solve.                                                                         |
| **Retention**                            | Capture payload is ephemeral for the request; not saved as a library source unless user saves in the web app. User-started tab-audio becomes a transcript the user can delete.               |
| **User control**                         | Disable cursor hover in settings; Record tab audio is click start/stop only; uninstall extension; sign out of Aproko.                                                                         |

**Host permission `<all_urls>`:** Required so users can use live context on arbitrary study sites (LMS, articles, quizzes). Full-page text is read **only** on explicit user actions (Capture / Alt-click solve), not on a background timer.

## 5) Reviewer notes (paste in “Notes for reviewer” if available)

```
Test account: [provide a test Aproko account or invite reviewer email — TODO]

Steps:
1. Install extension, set Web app URL to https://aprokoai.vercel.app
2. Sign in via Open connect checklist on a normal Chrome tab (handoff token — not iframe Google sign-in)
3. Open any https page with readable text (e.g. an article or quiz)
4. Click extension icon → side panel → Capture tab → Ask
5. Optional: Alt/Option-click a question; Chrome Record tab audio is click start/stop only

Not in this product: desktop overlay, OS meeting tap, native mobile, always-on tabCapture.

Privacy:
- Cursor hover can be disabled in Settings → "Enable cursor hover focus"
- Page text is redacted/truncated server-side before AI processing
- See privacy policy: https://aprokoai.vercel.app/privacy (Browser extension section)

Permissions justification: docs in repo extension-store-permissions-justification.md
```

## 6) Submit and monitor

1. **Submit for review** (first publish can take several days).
2. Watch email + Developer Dashboard for **Information needed** or policy rejections.
3. Common rejection themes for this extension:
   - Broad host permissions → respond with single-purpose + user-initiated capture narrative
   - Missing/invalid privacy policy → ensure production `/privacy` is updated
   - Permission not used → map each manifest permission to behavior in justification doc

## 7) After approval

1. Set default side panel Web app URL in docs/marketing to production (users still set once in Settings).
2. Link from `/extension/connect` on the live site.
3. Tag release in git (e.g. `extension-chrome-v0.3.5`).
4. Plan Safari using `apps/extension/safari/README.md` after Xcode is installed.

## Related files

- `apps/extension/STORE_LISTING.md` — copy/paste listing text
- `docs/12-backlog/extension-store-release-checklist.md` — full cross-store checklist
- `docs/12-backlog/extension-store-permissions-justification.md` — permission mapping
- `apps/extension/README.md` — load-unpacked dev instructions
