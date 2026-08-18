# Extension Store Permissions Justification (Live Context)

This document is intended for store reviewers (Chrome Web Store / Safari) to understand why the extension requests certain permissions.

## What the extension does
- Shows a “Cursor focus” UI while you are reading a page.
- Lets you press **Capture tab** to send readable page context to Aproko.
- Lets you **Alt/Option-click** a question to trigger an automated “solve this” flow.

## Permission mapping (Manifest V3)

### `permissions`
1. `activeTab`
   - Used so the extension can interact with the currently active page when the user triggers actions like “Capture tab”.
2. `scripting`
   - Used to inject/extract content when required for the requested action (capture/solve).
3. `tabs`
   - Used to locate the active tab URL for capture payload metadata.
4. `storage`
   - Used to persist extension settings (web app URL, hover toggle) and the short-lived connect handoff token. The token is not a Clerk cookie; it is minted after sign-in on a normal Aproko tab.
5. `commands`
   - Used to register keyboard shortcuts (**Ctrl/Cmd+Shift+Y** capture, **Ctrl/Cmd+Shift+H** hover capture).
6. `sidePanel`
   - Only used in Chrome as the embedded UI surface.
7. `tabCapture` (Chrome only)
   - Used only when the user clicks **Record tab audio**. The extension does not record in the background.
8. `offscreen` (Chrome only)
   - Used to run MediaRecorder for that user-started tab-audio clip, then the clip is uploaded to Aproko Transcripts.

### `host_permissions`
1. `<all_urls>`
   - The extension is designed to work on any http/https content page to capture cursor-focused text and, on demand, readable page text.
   - The extension does not execute on non-web-safe pages (e.g., `chrome://`); capture will fail with a user-facing message.

### `content_scripts`
- `matches: ["http://*/*", "https://*/*"]`
  - Needed to implement cursor hover focus and Alt/Option-click solve on content pages.
  - Full-page scraping is performed on user actions: “Capture tab” and Alt/Option-click solve (not continuously refreshed).

## User controls / privacy
- Cursor hover focus can be disabled from the extension settings (`Enable cursor hover focus`).
- Before sending page text to Aproko:
  - scraped text is formatted for readability
  - sensitive “password-like” and payment-card/SSN-like lines are redacted
  - payload size is limited

## Data handling summary
- Captured text is sent to the Aproko authenticated web API with the handoff bearer (or Clerk cookies on full web tabs).
- The API uses the captured context to generate an answer, and the result is returned to the extension UI.
- The extension MVP does not persist scraped page text as a long-lived “workspace source” unless the user explicitly saves content in the web app.
- Chrome tab-audio clips are uploaded only after the user clicks Record and then Stop; they become transcripts the user can delete. Safari does not request `tabCapture`.

## What this extension will never do (product lock)
- Capture the desktop or other applications
- Tap Zoom/Meet/Teams operating-system audio
- Record tabs in the background
- Ship as a native iOS or Android app

