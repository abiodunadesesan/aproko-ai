#!/usr/bin/env node
/**
 * Sync Chrome MV3 package → Safari Web Extension package.
 * Safari has no chrome.sidePanel — toolbar action opens a popup (same UI).
 */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeDir = path.join(root, 'extension');
const safariDir = path.join(root, 'safari');

await mkdir(safariDir, { recursive: true });

const copyFiles = [
  'content.js',
  'sidepanel.html',
  'sidepanel.js',
  'sidepanel.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

for (const relative of copyFiles) {
  const from = path.join(chromeDir, relative);
  const to = path.join(safariDir, relative);
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to);
}

const chromeBackground = await readFile(path.join(chromeDir, 'background.js'), 'utf8');
const safariBackground = chromeBackground
  .replace(
    /function isRestrictedTabUrl\(url\) \{[\s\S]*?\}/,
    `function isRestrictedTabUrl(url) {
  if (!url) {
    return true;
  }
  return /^(chrome|chrome-extension|chrome-search|chrome-untrusted|devtools|edge|about|view-source|safari-extension|safari-web-extension|resource):/i.test(
    url,
  );
}`,
  )
  .replace(
    /chrome\.runtime\.onInstalled\.addListener\(async \(\) => \{\s*await chrome\.sidePanel\.setPanelBehavior\(\{ openPanelOnActionClick: true \}\);\s*await setCaptureBadge\(''\);\s*\}\);/,
    `chrome.runtime.onInstalled.addListener(async () => {
  // Safari Web Extensions use action.default_popup (no sidePanel API).
  await setCaptureBadge('');
});`,
  )
  .replace(
    /Open Aproko at the web app URL in this Chrome profile\./g,
    'Open Aproko at the web app URL in this Safari profile.',
  );

await writeFile(path.join(safariDir, 'background.js'), safariBackground);

const sidepanelHtml = await readFile(path.join(safariDir, 'sidepanel.html'), 'utf8');
await writeFile(
  path.join(safariDir, 'sidepanel.html'),
  sidepanelHtml
    .replace(/Aproko · v[\d.]+/, 'Aproko · Safari v0.3.1')
    .replace(/normal Chrome tab/g, 'normal Safari tab')
    .replace(/side panel/gi, 'toolbar popup'),
);

const sidepanelJs = await readFile(path.join(safariDir, 'sidepanel.js'), 'utf8');
await writeFile(
  path.join(safariDir, 'sidepanel.js'),
  sidepanelJs.replace(/Chrome/g, 'Safari'),
);

const manifest = {
  manifest_version: 3,
  name: 'Aproko Live Context',
  version: '0.3.1',
  description: 'Live tab scrape + cursor hover context for Aproko AI (Safari).',
  action: {
    default_title: 'Open Aproko Live Context',
    default_popup: 'sidepanel.html',
    default_icon: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  commands: {
    'toggle-aproko-live-context': {
      suggested_key: {
        default: 'Ctrl+Shift+Y',
        mac: 'Command+Shift+Y',
      },
      description: 'Capture the active page for Aproko (then open the toolbar popup)',
    },
  },
  permissions: ['activeTab', 'scripting', 'commands', 'storage', 'tabs'],
  host_permissions: [
    '<all_urls>',
    'http://localhost:3000/*',
    'http://127.0.0.1:3000/*',
    'https://aprokoai.vercel.app/*',
  ],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['content.js'],
      run_at: 'document_idle',
    },
  ],
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
};

await writeFile(path.join(safariDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const readme = `# Aproko Live Context — Safari (Sprint 29)

Same companion as Chrome (\`apps/extension/extension\`), packaged for **Safari Web Extensions**.

Safari has no \`sidePanel\` API, so the UI opens as the **toolbar popup** (\`sidepanel.html\`).

## Load for local development (macOS)

### Option A — Convert to an Xcode app (recommended)

\`\`\`bash
pnpm --filter @aproko/extension sync:safari
xcrun safari-web-extension-converter apps/extension/safari \\
  --project-location apps/extension/safari-app \\
  --app-name "Aproko Live Context" \\
  --bundle-identifier ai.aproko.livecontext.safari \\
  --force
\`\`\`

Then open the generated Xcode project, run the macOS app target, and enable the extension in
**Safari → Settings → Extensions**.

### Option B — Unsigned extension (Safari Develop menu)

1. Safari → Settings → Advanced → **Show features for web developers**
2. Develop → **Allow Unsigned Extensions**
3. Convert / build as above (Safari still expects an app wrapper for most installs)

## Use

1. Sign in to Aproko at \`http://localhost:3000\` in Safari.
2. Open the extension popup → Settings → Web app URL = your origin.
3. On a normal webpage, press **Cmd+Shift+Y** to capture (or Capture in the popup).
4. Ask in the embedded live panel.

## Sync after Chrome changes

\`\`\`bash
pnpm --filter @aproko/extension sync:safari
\`\`\`

This copies content/UI assets from \`extension/\` and regenerates Safari \`manifest.json\` + background.
`;

await writeFile(path.join(safariDir, 'README.md'), readme);

console.log(`Safari package synced → ${safariDir}`);
