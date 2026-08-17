# Store Listing Draft — Aproko Live Context

Use this as the starting point for:
- Chrome Web Store listing
- Safari Web Extension listing (metadata copy)

## Package
- Chrome: `apps/extension/extension`
- Safari: `apps/extension/safari`

## Privacy policy URL
- `https://aprokoai.vercel.app/privacy` (or your final production URL)

## Permissions to describe (high level)
- Access your data on any website (http/https pages)
- Capture and send readable page text to improve learning support

## Chrome Web Store listing

### Name
**Aproko Live Context**

### Short description (max ~200 chars)
Ask Aproko about the page you’re reading. Cursor focus + “Capture tab” and Alt/Option-click solve for quick learning help.

### Full description
Aproko Live Context helps you learn faster while you browse.

What you can do:
- **Cursor focus**: see the key text you’re pointing at while you read.
- **Capture tab**: send readable page context to Aproko to get a grounded explanation or answer.
- **Alt/Option-click solve**: click a quiz question (Alt/Option-click) to let Aproko select the best option or fill a short answer.

Privacy:
- The extension captures text from the currently viewed page to generate learning help.
- Sensitive lines are redacted before sending to our services.
- You can disable cursor hover focus in extension settings.

How to use:
1. Load the extension.
2. Sign in to Aproko in the same browser profile.
3. Open any quiz/article page.
4. Press **Capture tab**, or Alt/Option-click a question.

## Support / contact
- Support email: `support@aproko.ai` (TODO: replace with real contact)

## Screenshots (suggested set)
1. Extension side panel showing “Cursor focus” and “Page snapshot”
2. A quiz page with the Alt/Option-click solve tip
3. Extension settings showing “Enable cursor hover focus”
4. Example of the highlight + answer application on a multiple-choice question

## Reviewer notes (attach in submission)
- We only perform full-page scraping on explicit actions (“Capture tab” or Alt/Option-click solve).
- Cursor hover focus can be disabled by the user.
- Redaction and truncation are applied before sending page text to the backend.

