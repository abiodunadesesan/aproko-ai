# Extension Store Release Checklist (Chrome Web Store + Safari)

## Goal
Prepare the Aproko “Live Context” browser extension for store submission with complete privacy disclosure, permission justification, and listing assets.

## Prerequisites
1. Extension packages build and verify
   - Chrome: `/apps/extension/extension`
   - Safari: `/apps/extension/safari`
2. Version numbers are aligned across packages (and listed in store submission)

## Privacy & Disclosure (highest priority)
1. Update public policy text
   - `apps/web/app/(marketing)/privacy/page.tsx` uses `apps/web/lib/legal-content.ts`
   - Confirm the “Browser extension (Live Context)” section is present and accurate
2. Add extension-specific FAQs / reviewer notes
   - Describe what is captured (cursor-focused snippet + optional full-page text + Chrome opt-in tab audio)
   - Explain when capture happens (Capture tab / Cmd+Shift+Y / Cmd+Shift+H / Alt-click solve / Record tab audio click)
   - Explain how hover focus can be controlled (extension setting)
   - Explain redaction/formatting limits before sending to backend
   - Explain connect handoff token (not Clerk cookies in the iframe)
3. Confirm retention statement
   - MVP does not persist page text as long-lived workspace sources unless user explicitly saves content in the web app
   - User-started tab-audio clips become transcripts the user can delete

## Permissions Justification
1. Manifest review for store questionnaire
   - `activeTab`, `scripting`: used for targeted extraction and injected UI behavior
   - `tabs`: needed to determine active tab context for capture
   - `content_scripts` matches: injected on http/https pages to enable hover focus and solve
   - `host_permissions`: verify the rationale in a reviewer-friendly document
   - `tabCapture` / `offscreen`: Chrome Record tab audio only (user click start/stop; not always-on)
   - `storage`: settings plus short-lived connect handoff token
2. Ensure the reviewer-facing story matches actual behavior
   - Full-page scraping is performed on user actions (Capture tab / Alt-click solve)
   - Hover focus can be disabled by user setting
   - Tab audio never runs until the user clicks Record

## Listing Assets & Copy
1. Create store screenshots
   - Side panel “Cursor focus” view
   - “Page snapshot” topic summary
   - Alt/Option-click to solve a multiple-choice question
2. Prepare listing copy
   - Chrome Web Store short description
   - Chrome Web Store long description
   - Chrome privacy policy URL
   - Safari store metadata (similar structure)

## Store Submission Steps
### Chrome Web Store
1. Upload extension package build
2. Fill in:
   - Permissions requested
   - Data usage + privacy questionnaire
   - Support email
3. Attach reviewer notes (this checklist and the permission justification doc)

### Safari
1. Convert extension package to a signed app wrapper (requires Xcode)
2. Use Apple distribution workflow (developer account / notarization as required)
3. Provide Apple privacy disclosure if required by the wrapper app configuration

## Release gating before stores go live
1. Manual smoke test on production host — `docs/12-backlog/extension-production-smoke.md`
2. Confirm:
   - Connect handoff then Ask works
   - Capture works (Y) and hover pin (H)
   - Alt/Option-click solve works
   - Hover focus respects the “Enable cursor hover focus” setting
   - Chrome Record tab audio is opt-in; Safari has no tabCapture
3. Confirm CORS preflight (`OPTIONS`) for `/api/chat` and `/api/v1/extension/*` returns 204 from extension origins
4. Do **not** submit to CWS until screenshots + $5 developer account are ready (owner action)

## Product lock (will not ship)
- Desktop overlay / other-app capture
- Invisible OS meeting audio
- Native iOS/Android
- Always-on tab recording

