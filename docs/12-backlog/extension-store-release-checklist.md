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
   - Describe what is captured (cursor-focused snippet + optional full-page text)
   - Explain when capture happens (Capture tab / Alt-click solve)
   - Explain how hover focus can be controlled (extension setting)
   - Explain redaction/formatting limits before sending to backend
3. Confirm retention statement
   - MVP does not persist page text as long-lived workspace sources unless user explicitly saves content in the web app

## Permissions Justification
1. Manifest review for store questionnaire
   - `activeTab`, `scripting`: used for targeted extraction and injected UI behavior
   - `tabs`: needed to determine active tab context for capture
   - `content_scripts` matches: injected on http/https pages to enable hover focus and solve
   - `host_permissions`: verify the rationale in a reviewer-friendly document
2. Ensure the reviewer-facing story matches actual behavior
   - Full-page scraping is performed on user actions (Capture tab / Alt-click solve)
   - Hover focus can be disabled by user setting

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
1. Manual smoke test on production host
2. Confirm:
   - Capture works
   - Alt/Option-click solve works
   - Hover focus respects the “Enable cursor hover focus” setting
3. Confirm CORS + iframe embedding work for the store-installed origin

