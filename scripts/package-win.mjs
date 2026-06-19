#!/usr/bin/env node
/**
 * Build a portable Windows .exe kids can double-click to play.
 *
 * Requires explicit approval (do not run casually after every code change):
 *   npm run package:win -- --approve
 *
 * Release workflow:
 *   1. npm run bump:version
 *   2. npm run package:win -- --approve
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');

const approved =
  process.argv.includes('--approve') ||
  process.env.APPROVE_EXE_BUILD === '1' ||
  process.env.APPROVE_EXE_BUILD === 'true';

if (!approved) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  console.error(`
Portable .exe build blocked — approval required.

Current version: ${pkg.version}
Would create:    release/Keyboard-Learning-${pkg.version}-portable.exe

Before building a new release:
  1. Bump version:  npm run bump:version
  2. Build with OK: npm run package:win -- --approve

Only run step 2 after you have approved the release.
`);
  process.exit(1);
}

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false', ...env },
  });
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
console.log(`\nBuilding Key Buddy portable v${pkg.version}...\n`);

run('npm run generate:icons');
run('npm run build');
run('npx electron-builder --win portable');
// Patch icons: inner app via rcedit; portable NSIS launcher via resedit (rcedit corrupts SFX).
run('node scripts/patch-win-exe.mjs');
run('node scripts/patch-portable-icon.mjs');

const exeName = `Keyboard-Learning-${pkg.version}-portable.exe`;
const exePath = path.join(releaseDir, exeName);

if (!fs.existsSync(exePath)) {
  console.error(`Expected portable exe not found: ${exePath}`);
  process.exit(1);
}

const readme = `Key Buddy — Windows (v${pkg.version})
=========================

Double-click this file to play:

  ${exeName}

You can copy it to the Desktop or a USB stick. No install needed.

Taskbar tip:
  - If an old "Electron" pin exists, right-click it → Unpin, then run this file
    and pin Key Buddy again from the running app icon.

Tips:
  - Press F11 for fullscreen
  - Grown-ups: click the gear on the welcome screen for settings

If Windows shows "Windows protected your PC", click "More info" then "Run anyway".
This is normal for apps that are not store-signed.
`;

fs.writeFileSync(path.join(releaseDir, 'PLAY-HERE-WINDOWS.txt'), readme);
console.log(`\nReady: release/${exeName}\n`);
