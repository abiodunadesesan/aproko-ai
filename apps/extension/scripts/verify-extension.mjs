#!/usr/bin/env node
/**
 * Full verification for Chrome + Safari extension packages.
 */
import { access, constants, readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeDir = path.join(root, 'extension');
const safariDir = path.join(root, 'safari');

const required = [
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

async function assertReadable(label, dir, files) {
  for (const relative of files) {
    await access(path.join(dir, relative), constants.R_OK);
  }
  console.log(`✔ ${label} package files (${files.length})`);
}

async function assertJsSyntax(label, dir, files) {
  for (const relative of files) {
    const target = path.join(dir, relative);
    await execFileAsync('node', ['--check', target]);
  }
  console.log(`✔ ${label} JavaScript syntax (${files.length} files)`);
}

async function readJson(dir, relative) {
  return JSON.parse(await readFile(path.join(dir, relative), 'utf8'));
}

async function readText(dir, relative) {
  return readFile(path.join(dir, relative), 'utf8');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(`${message}: expected to include ${JSON.stringify(needle)}`);
  }
}

function assertExcludes(haystack, needle, message) {
  if (haystack.includes(needle)) {
    throw new Error(`${message}: must not include ${JSON.stringify(needle)}`);
  }
}

await assertReadable('Chrome', chromeDir, required);
await assertReadable('Safari', safariDir, [...required, 'README.md']);

const jsFiles = ['background.js', 'content.js', 'sidepanel.js'];
await assertJsSyntax('Chrome', chromeDir, jsFiles);
await assertJsSyntax('Safari', safariDir, jsFiles);

const chromeManifest = await readJson(chromeDir, 'manifest.json');
const safariManifest = await readJson(safariDir, 'manifest.json');

assertEqual(chromeManifest.manifest_version, 3, 'Chrome manifest_version');
assertEqual(safariManifest.manifest_version, 3, 'Safari manifest_version');
assertEqual(
  chromeManifest.version,
  safariManifest.version,
  'Chrome and Safari versions must match',
);
assertIncludes(JSON.stringify(chromeManifest), 'side_panel', 'Chrome manifest must include side_panel');
assertExcludes(JSON.stringify(safariManifest), 'side_panel', 'Safari manifest must not include side_panel');
assertEqual(
  safariManifest.action?.default_popup,
  'sidepanel.html',
  'Safari popup path',
);

const chromeBackground = await readText(chromeDir, 'background.js');
const safariBackground = await readText(safariDir, 'background.js');
const chromeContent = await readText(chromeDir, 'content.js');
const safariContent = await readText(safariDir, 'content.js');
const chromeSidepanelCss = await readText(chromeDir, 'sidepanel.css');
const safariSidepanelCss = await readText(safariDir, 'sidepanel.css');

assertIncludes(chromeBackground, 'chrome.sidePanel', 'Chrome background uses sidePanel API');
assertExcludes(safariBackground, 'chrome.sidePanel.setPanelBehavior', 'Safari background must not call sidePanel');
assertIncludes(safariBackground, 'safari-web-extension', 'Safari restricted URL patterns');
assertIncludes(chromeBackground, '/api/v1/live-context/solve', 'Solve flat API path');
assertExcludes(chromeBackground, 'llama-3.1-8b-instant', 'Deprecated Groq model must not be hardcoded');
assertExcludes(safariBackground, 'llama-3.1-8b-instant', 'Deprecated Groq model must not be hardcoded');
assertExcludes(chromeSidepanelCss, '#d97706', 'Extension UI must not use orange accent');
assertExcludes(chromeContent, '#d97706', 'Content script must not use orange accent');
assertIncludes(chromeSidepanelCss, '--accent: #18181b', 'Extension uses zinc primary accent');

assertEqual(chromeContent, safariContent, 'content.js must match between Chrome and Safari');
assertEqual(chromeSidepanelCss, safariSidepanelCss, 'sidepanel.css must match between Chrome and Safari');
assertIncludes(chromeSidepanelCss, 'min-width: 400px', 'Popup min-width for Safari toolbar popup');

const safariSidepanelHtml = await readText(safariDir, 'sidepanel.html');
assertIncludes(safariSidepanelHtml, 'Safari v', 'Safari sidepanel branding');
assertIncludes(safariSidepanelHtml, 'full browser tab', 'Safari sign-in guidance');

console.log('✔ Chrome manifest v' + chromeManifest.version);
console.log('✔ Safari manifest v' + safariManifest.version);
console.log('✔ Chrome/Safari parity + API wiring');
console.log('');
console.log('Aproko extension full verify OK (Chrome + Safari)');
