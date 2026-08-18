#!/usr/bin/env node
/**
 * Build a Chrome Web Store upload ZIP from apps/extension/extension.
 * Usage: node ./scripts/pack-chrome.mjs
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionDir = path.join(root, 'extension');
const distDir = path.join(root, 'dist');

const required = [
  'manifest.json',
  'background.js',
  'content.js',
  'sidepanel.html',
  'sidepanel.js',
  'sidepanel.css',
  'offscreen.html',
  'offscreen.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

for (const relative of required) {
  await access(path.join(extensionDir, relative), constants.R_OK);
}

const manifest = JSON.parse(await readFile(path.join(extensionDir, 'manifest.json'), 'utf8'));
const version = manifest.version || '0.0.0';
const zipName = `aproko-live-context-chrome-v${version}.zip`;
const zipPath = path.join(distDir, zipName);

await mkdir(distDir, { recursive: true });

// Zip contents of extension/ (not the folder itself) — CWS expects manifest.json at root of zip.
await execFileAsync('zip', ['-r', zipPath, '.', '-x', '*.DS_Store'], {
  cwd: extensionDir,
});

console.log(`Chrome Web Store ZIP ready:\n  ${zipPath}\n  version ${version}\n  Upload this file in the Developer Dashboard.`);
