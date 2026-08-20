#!/usr/bin/env node
/**
 * Sync Chrome MV3 package → Safari Web Extension package.
 * Safari has no chrome.sidePanel — toolbar action opens a popup (same UI).
 */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
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

const chromeManifestRaw = await readFile(path.join(chromeDir, 'manifest.json'), 'utf8');
const chromeManifest = JSON.parse(chromeManifestRaw);
const safariVersion = chromeManifest.version || '0.0.0';

const chromeBackground = await readFile(path.join(chromeDir, 'background.js'), 'utf8');
const chromeRestrictedUrlFn = `function isRestrictedTabUrl(url) {
  if (!url) {
    return true;
  }
  return /^(chrome|chrome-extension|chrome-search|chrome-untrusted|devtools|edge|about|view-source):/i.test(
    url,
  );
}`;

const safariRestrictedUrlFn = `function isRestrictedTabUrl(url) {
  if (!url) {
    return true;
  }
  return /^(chrome|chrome-extension|chrome-search|chrome-untrusted|devtools|edge|about|view-source|safari-extension|safari-web-extension|resource):/i.test(
    url,
  );
}`;

const safariBackground = chromeBackground
  .replace(chromeRestrictedUrlFn, safariRestrictedUrlFn)
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
    .replace(/Aproko · v[\d.]+/, `Aproko · Safari v${safariVersion}`)
    .replace(/normal Chrome tab/g, 'normal Safari tab')
    .replace(/side panel/gi, 'toolbar popup'),
);

const sidepanelJs = await readFile(path.join(safariDir, 'sidepanel.js'), 'utf8');
await writeFile(path.join(safariDir, 'sidepanel.js'), sidepanelJs.replace(/Chrome/g, 'Safari'));

const manifest = {
  manifest_version: 3,
  name: 'Aproko Live Context',
  version: safariVersion,
  description: 'Live tab scrape + cursor hover context for Aproko AI (Safari).',
  action: {
    default_title: 'Open Aproko Live Context',
    default_popup: 'sidepanel.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
  background: {
    service_worker: 'background.js',
    // Safari does not support "type": "module" for service workers
  },
  commands: {
    'toggle-aproko-live-context': {
      suggested_key: {
        default: 'Ctrl+Shift+Y',
        mac: 'Command+Shift+Y',
      },
      description: 'Capture the active page for Aproko (then open the toolbar popup)',
    },
    'capture-hover-context': {
      suggested_key: {
        default: 'Ctrl+Shift+H',
        mac: 'Command+Shift+H',
      },
      description: 'Capture the text under the cursor for Aproko hover context',
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
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
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

1. Sign in to Aproko in a **normal Safari tab**, then open **Open connect checklist** (handoff token). Clerk cookies do not reach the popup iframe.
2. Open the extension popup → Settings → Web app URL = your origin (production: \`https://aprokoai.vercel.app\`).
3. On a normal webpage, press **Cmd+Shift+Y** to capture (or Capture in the popup). **Cmd+Shift+H** pins hover text.
4. Ask in the embedded live panel.
5. Safari does **not** record tab audio (no \`tabCapture\`). Use the web app recorder on \`/transcripts\` or \`/dashboard\` instead.

## Production smoke

Follow \`docs/12-backlog/extension-production-smoke.md\`. Xcode wrapper lives at \`apps/extension/safari-app/Aproko Live Context/\` after converter runs.

## Sync after Chrome changes

\`\`\`bash
pnpm --filter @aproko/extension sync:safari
\`\`\`

This copies content/UI assets from \`extension/\` and regenerates Safari \`manifest.json\` + background.
`;

await writeFile(path.join(safariDir, 'README.md'), readme);

console.log(`Safari package synced → ${safariDir}`);

// Auto-build the macOS scheme if the Xcode project exists
const xcodeproj = path.join(
  root,
  'safari-app',
  'Aproko Live Context',
  'Aproko Live Context.xcodeproj',
);

try {
  await import('node:fs').then(({ default: fs }) => {
    if (!fs.existsSync(xcodeproj)) throw new Error('no project');
  });

  // Sign with the user's Personal Team so Safari can discover the extension.
  // Team ID is also baked into project.pbxproj; keep in sync if the Apple ID changes.
  const developmentTeam = process.env.APROKO_SAFARI_TEAM_ID || 'Z55LJ78DGQ';
  console.log(`\nBuilding macOS scheme with Apple Development team ${developmentTeam} …`);
  const buildOutput = execSync(
    `xcodebuild \
      -project "${xcodeproj}" \
      -scheme "Aproko Live Context (macOS)" \
      -configuration Debug \
      -destination "platform=macOS" \
      -allowProvisioningUpdates \
      build \
      DEVELOPMENT_TEAM=${developmentTeam} \
      CODE_SIGN_STYLE=Automatic \
      CODE_SIGNING_REQUIRED=YES \
      CODE_SIGNING_ALLOWED=YES \
      2>&1`,
    { encoding: 'utf8', shell: '/bin/zsh' },
  );
  const buildFailed = /BUILD FAILED/.test(buildOutput);
  if (buildFailed) {
    console.error(
      buildOutput
        .split('\n')
        .filter((line) => /error:|warning:.*[Ss]ign|BUILD FAILED|No profiles|requires a development team/.test(line))
        .join('\n'),
    );
    throw new Error('xcodebuild failed');
  }
  console.log(buildOutput.split('\n').filter((line) => /BUILD SUCCEEDED/.test(line)).join('\n'));

  const { default: fs } = await import('node:fs');
  const builtApp = (() => {
    const derived = path.join(
      process.env.HOME || '',
      'Library/Developer/Xcode/DerivedData',
    );
    if (!fs.existsSync(derived)) return null;
    for (const entry of fs.readdirSync(derived)) {
      if (!entry.startsWith('Aproko_Live_Context-')) continue;
      const candidate = path.join(
        derived,
        entry,
        'Build/Products/Debug/Aproko Live Context.app',
      );
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  })();

  if (builtApp) {
    // Install into /Applications so Safari can discover the extension reliably.
    // Do NOT re-sign with ad-hoc "-" — that strips the team signature Safari needs.
    const installPath = '/Applications/Aproko Live Context.app';
    try {
      execSync(`rm -rf "${installPath}" && cp -R "${builtApp}" "${installPath}"`, {
        stdio: 'inherit',
      });
      const teamLine = execSync(`codesign -dv "${installPath}" 2>&1 | rg "TeamIdentifier|Signature=" || true`, {
        encoding: 'utf8',
        shell: '/bin/zsh',
      }).trim();
      console.log(`\n✅ Installed → ${installPath}`);
      if (teamLine) console.log(`   ${teamLine.replace(/\n/g, ' | ')}`);
    } catch {
      console.warn('\n⚠️  Could not copy to /Applications (permission?). Open the DerivedData app instead:');
      console.warn(`   open "${builtApp}"`);
    }
  }

  console.log('\n✅ macOS build succeeded.');
  console.log('   Next steps:');
  console.log('   1. open "/Applications/Aproko Live Context.app"');
  console.log('   2. Quit Safari completely (Cmd+Q), reopen it');
  console.log('   3. Develop → Allow Unsigned Extensions (every Safari launch)');
  console.log('   4. Safari → Settings → Extensions → enable "Aproko Live Context"');
} catch (err) {
  if (err.message !== 'no project') {
    console.warn('\n⚠️  xcodebuild failed — open Xcode manually and run the macOS scheme:');
    console.warn(`   open "${xcodeproj}"`);
    console.warn(
      '   Then select scheme "Aproko Live Context (macOS)" + destination "My Mac" and press ⌘R.',
    );
  } else {
    console.log(
      '\nXcode project not found. Run the safari-web-extension-converter first (see README).',
    );
  }
}
