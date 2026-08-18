# Aproko Live Context — Safari (Sprint 29)

Same companion as Chrome (`apps/extension/extension`), packaged for **Safari Web Extensions**.

Safari has no `sidePanel` API, so the UI opens as the **toolbar popup** (`sidepanel.html`).

## Load for local development (macOS)

### Option A — Convert to an Xcode app (recommended)

```bash
pnpm --filter @aproko/extension sync:safari
xcrun safari-web-extension-converter apps/extension/safari \
  --project-location apps/extension/safari-app \
  --app-name "Aproko Live Context" \
  --bundle-identifier ai.aproko.livecontext.safari \
  --force
```

Then open the generated Xcode project, run the macOS app target, and enable the extension in
**Safari → Settings → Extensions**.

### Option B — Unsigned extension (Safari Develop menu)

1. Safari → Settings → Advanced → **Show features for web developers**
2. Develop → **Allow Unsigned Extensions**
3. Convert / build as above (Safari still expects an app wrapper for most installs)

## Use

1. Sign in to Aproko in a **normal Safari tab**, then open **Open connect checklist** (handoff token). Clerk cookies do not reach the popup iframe.
2. Open the extension popup → Settings → Web app URL = your origin.
3. On a normal webpage, press **Cmd+Shift+Y** to capture (or Capture in the popup). **Cmd+Shift+H** pins hover text.
4. Ask in the embedded live panel.
5. Safari does **not** record tab audio (no `tabCapture`). Use the web app recorder on `/transcripts` or `/dashboard` instead.

## Sync after Chrome changes

```bash
pnpm --filter @aproko/extension sync:safari
```

This copies content/UI assets from `extension/` and regenerates Safari `manifest.json` + background.
