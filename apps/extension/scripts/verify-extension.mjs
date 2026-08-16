import { access, constants, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function verifyPackage(label, dir, required) {
  for (const relative of required) {
    const target = path.join(dir, relative);
    await access(target, constants.R_OK);
  }
  console.log(`OK ${label} (${required.length} files in ${dir})`);
}

const chromeRequired = [
  'manifest.json',
  'background.js',
  'content.js',
  'sidepanel.html',
  'sidepanel.js',
  'sidepanel.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

const safariRequired = [...chromeRequired, 'README.md'];

await verifyPackage('Chrome', path.join(root, 'extension'), chromeRequired);
await verifyPackage('Safari', path.join(root, 'safari'), safariRequired);

const safariManifest = JSON.parse(
  await readFile(path.join(root, 'safari', 'manifest.json'), 'utf8'),
);
if (safariManifest.side_panel) {
  throw new Error('Safari manifest must not include side_panel');
}
if (safariManifest.action?.default_popup !== 'sidepanel.html') {
  throw new Error('Safari manifest must set action.default_popup to sidepanel.html');
}

console.log('Aproko extension packages OK (Chrome + Safari)');
