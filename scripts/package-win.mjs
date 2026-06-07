#!/usr/bin/env node
/**
 * Build a portable Windows .exe kids can double-click to play.
 * Run: npm run package:win
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'release');

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false', ...env },
  });
}

run('npm run build');
run('npx electron-builder --win portable');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const exeName = `Keyboard-Learning-${pkg.version}-portable.exe`;
const exePath = path.join(releaseDir, exeName);

if (!fs.existsSync(exePath)) {
  console.error(`Expected portable exe not found: ${exePath}`);
  process.exit(1);
}

const readme = `Keyboard Learning — Windows
=========================

Double-click this file to play:

  ${exeName}

You can copy it to the Desktop or a USB stick. No install needed.

Tips:
  - Press F11 for fullscreen
  - Grown-ups: click the gear on the welcome screen for settings

If Windows shows "Windows protected your PC", click "More info" then "Run anyway".
This is normal for apps that are not store-signed.
`;

fs.writeFileSync(path.join(releaseDir, 'PLAY-HERE-WINDOWS.txt'), readme);
console.log(`\nReady: release/${exeName}\n`);
