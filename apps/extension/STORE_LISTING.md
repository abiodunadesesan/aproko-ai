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
- Microphone access, requested only when you tap the voice input button — audio is sent to your Aproko server for Whisper transcription
- Optional Chrome tab audio, only after you click **Record tab audio**

## Chrome Web Store listing

### Name

**Aproko Live Context**

### Short description (≤132 characters)

Ask Aproko about any page you're reading. Press Ctrl+/ to ask right at the cursor — type or speak with Whisper voice input.

### Full description

Aproko Live Context is a companion for signed-in Aproko AI users. It helps you learn from the webpage you already have open.

What you can do:

- **Inline cursor ask (Ctrl+/)**: press Ctrl+/ while hovering any page element to open a mini ask input right at the cursor. Type your question and press Enter — Aproko streams the answer inline, no side panel needed.
- **Voice input (Whisper)**: tap the mic button in the inline ask card to record your question. Audio is transcribed by OpenAI Whisper server-side — works cross-browser, not limited to Chrome's built-in speech recognition.
- **Capture tab** (toolbar or Ctrl+Shift+Y / Cmd+Shift+Y): send the full page text to Aproko and ask a grounded question in the side panel.
- **Cursor focus**: see the text under your pointer highlighted in the side panel. Pin it with Ctrl+Shift+H / Cmd+Shift+H.
- **Live Transcript**: a short timeline of page captures and hover snippets.
- **Alt/Option-click solve**: on a quiz or MCQ question, ask Aproko to pick the correct option or fill a short answer — it auto-fills the field.
- **Save captures to library**: every Ask automatically saves the page text as a source in your Aproko workspace library for future reference.
- **Record tab audio (Chrome only)**: click to start, click to stop. Audio is transcribed into your Aproko Transcripts. The extension does not record in the background.

What this extension does **not** do:

- It does not capture your whole desktop or other apps.
- It does not tap Zoom/Meet/Teams system audio.
- It does not run as a phone app.
- It does not record tabs until you press a button.

Privacy:

- Captured text is sent to your Aproko workspace API to generate a learning answer.
- Voice audio is sent to your Aproko server for Whisper transcription and is not stored.
- Password- and payment-like lines are redacted; payloads are size-limited.
- Cursor hover can be turned off in Settings.
- Sign in on a normal Aproko tab first. The panel uses a short-lived connect token because Google sign-in cannot run inside the extension iframe.

Requires: Aproko Pro plan for Live Context features (inline ask, solve, capture).

How to use:

1. Install the extension.
2. Sign in at https://aprokoai.vercel.app in a normal Chrome tab.
3. Open the side panel → Open connect checklist → refresh once → return to the panel.
4. Open any https article or quiz → hover text → press **Ctrl+/** to ask right at the cursor.

Support: use the contact details on https://aprokoai.vercel.app/privacy

## Screenshots (suggested set)

1. Inline ask card at cursor — question input + 🎤 mic + streamed answer
2. Side panel: Ask AI + Cursor focus + Page snapshot
3. Alt/Option-click solve on a multiple-choice question — auto-filled answer
4. Settings: Web app URL + Enable cursor hover focus
5. (Chrome) Record tab audio control — start/stop, not always-on

## Reviewer notes (attach in submission)

```
Single purpose: help signed-in Aproko Pro users ask questions about the webpage they are viewing.

New in v0.3.5:
- Ctrl+/ inline ask at cursor (type or Whisper voice)
- Pro plan gating (402 for free workspaces)
- Page captures saved to workspace library

Not in this product:
- Desktop overlay / other-app screen capture
- Invisible OS meeting audio
- Native iOS/Android apps
- Always-on tabCapture

Test steps:
1. Set Web app URL to https://aprokoai.vercel.app
2. Sign in on a normal tab via Open connect checklist (Pro workspace)
3. Open an https article → hover text → press Ctrl+/ → type a question → Enter
4. Tap 🎤 mic → speak a question → confirm Whisper transcribes and answer streams
5. Alt/Option-click a quiz question → confirm answer auto-fills
6. Optional: test with a Free workspace → expect upgrade prompt

Privacy policy: https://aprokoai.vercel.app/privacy (Browser extension section)
Permissions: see extension-store-permissions-justification.md in the Aproko repo
```
