# Store Listing Draft — Aproko Live Context

Use this as the starting point for:
- Chrome Web Store listing
- Safari Web Extension listing (metadata copy)

Version: **0.3.5**

## Package
- Chrome: `apps/extension/extension`
- Safari: `apps/extension/safari`

## Privacy policy URL
- `https://aprokoai.vercel.app/privacy`

## Permissions to describe (high level)
- Access your data on websites you visit (http/https pages) so you can capture the page you are reading
- Optional Chrome tab audio, only after you click **Record tab audio**

## Chrome Web Store listing

### Name
**Aproko Live Context**

### Short description (≤132 characters)
Ask Aproko about the page you’re reading. Capture tab, cursor focus, and optional quiz solve — never silent recording.

### Full description
Aproko Live Context is a companion for signed-in Aproko AI users. It helps you learn from the webpage you already have open.

What you can do:
- **Capture tab** (toolbar or Cmd/Ctrl+Shift+Y): send readable page text to Aproko and ask a grounded question.
- **Cursor focus**: see the text under your pointer. Pin it with Cmd/Ctrl+Shift+H.
- **Live Transcript**: a short timeline of page captures and hover snippets in the side panel.
- **Alt/Option-click solve**: on a quiz question, ask Aproko to pick an option or fill a short answer.
- **Record tab audio (Chrome only)**: click to start, click to stop. Audio is transcribed into your Aproko Transcripts. The extension does not record in the background.

What this extension does **not** do:
- It does not capture your whole desktop or other apps.
- It does not tap Zoom/Meet/Teams system audio.
- It does not run as a phone app.
- It does not record tabs until you press a button.

Privacy:
- Captured text is sent to your Aproko workspace API to generate a learning answer.
- Password- and payment-like lines are redacted; payloads are size-limited.
- Cursor hover can be turned off in Settings.
- Sign in on a normal Aproko tab first. The panel uses a short-lived connect token because Google sign-in cannot run inside the extension iframe.

How to use:
1. Install the extension.
2. Sign in at https://aprokoai.vercel.app in a normal Chrome tab.
3. Open the side panel → Open connect checklist → refresh once → return to the panel.
4. Open any https article or quiz → Capture tab → ask.

Support: use the contact details on https://aprokoai.vercel.app/privacy

## Screenshots (suggested set)
1. Side panel: Ask AI + Cursor focus + Page snapshot
2. Live Transcript feed after hovering a page
3. Settings: Web app URL + Enable cursor hover focus
4. Alt/Option-click solve on a multiple-choice question
5. (Chrome) Record tab audio control — start/stop, not always-on

## Reviewer notes (attach in submission)

```
Single purpose: help signed-in Aproko users ask questions about the webpage they are viewing.

Not in this product:
- Desktop overlay / other-app screen capture
- Invisible OS meeting audio
- Native iOS/Android apps
- Always-on tabCapture

Test steps:
1. Set Web app URL to https://aprokoai.vercel.app
2. Sign in on a normal tab via Open connect checklist
3. Open an https article → Capture tab → ask a question
4. Optional: disable cursor hover in Settings
5. Chrome only: Record tab audio requires an explicit click to start and to stop

Privacy policy: https://aprokoai.vercel.app/privacy (Browser extension section)
Permissions: see extension-store-permissions-justification.md in the Aproko repo
```
