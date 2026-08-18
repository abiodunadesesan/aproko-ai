# Extension store submit — ready now (v0.3.5)

Use this as the owner checklist after automated gates pass.

## Artifacts

| Item                        | Location                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Chrome upload ZIP           | `apps/extension/dist/aproko-live-context-chrome-v0.3.5.zip`                   |
| Git tag (create if missing) | `extension-chrome-v0.3.5`                                                     |
| Listing copy                | `apps/extension/STORE_LISTING.md`                                             |
| Permissions narrative       | `docs/12-backlog/extension-store-permissions-justification.md`                |
| Privacy URL                 | https://aprokoai.vercel.app/privacy                                           |
| Safari Xcode project        | `apps/extension/safari-app/Aproko Live Context/Aproko Live Context.xcodeproj` |

## Chrome Web Store — paste-ready

**Name:** Aproko Live Context  
**Category:** Productivity or Education  
**Privacy policy:** https://aprokoai.vercel.app/privacy  
**Support:** privacy@aproko.ai (or add support@ when live)

**Single purpose (Privacy tab):**  
Help signed-in Aproko users ask questions about the webpage they are viewing using user-initiated capture and optional cursor focus.

**Reviewer notes:** see `apps/extension/STORE_LISTING.md` → Reviewer notes section.

**Still required before Submit:**

- [ ] 1–5 screenshots (1280×800 recommended)
- [ ] $5 Chrome Web Store developer account
- [ ] Manual signed-in smoke (`docs/12-backlog/extension-production-smoke.md` §1–2)

## Safari — next after Chrome

1. Open `apps/extension/safari-app/Aproko Live Context/Aproko Live Context.xcodeproj`
2. Run **macOS (App)** target → enable extension in Safari → Settings → Extensions
3. Repeat production smoke without tab audio
4. Apple Developer distribution / notarization when ready for App Store Connect

## CI note

GitHub **Vercel Deploy** workflow may fail on invalid `VERCEL_TOKEN`; Vercel Git integration still deployed production for commit `221cc37`. Rotate the secret when convenient.
