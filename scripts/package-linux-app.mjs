#!/usr/bin/env node
/**
 * Build a Linux AppImage — double-click like a real app (no Python server).
 *
 *   npm run bump:version
 *   npm run package:linux:app -- --approve
 *
 * Best built on Linux or WSL. From Windows without WSL, use package:linux zip instead.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const approved =
  process.argv.includes('--approve') ||
  process.env.APPROVE_EXE_BUILD === '1' ||
  process.env.APPROVE_EXE_BUILD === 'true';

if (!approved) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  console.error(`
Linux AppImage build blocked — approval required.

Current version: ${pkg.version}
Would create:    release/Key-Buddy-${pkg.version}.AppImage

  1. npm run bump:version
  2. npm run package:linux:app -- --approve

Tip: Build on Linux Mint or WSL for best results.
For a simpler zip launcher, use: npm run package:linux
`);
  process.exit(1);
}

function run(cmd, env = {}) {
  execSync(cmd, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
console.log(`\nBuilding Key Buddy AppImage v${pkg.version}...\n`);

run('npm run generate:icons');
run('npm run build');
run('npx electron-builder --linux AppImage');

const appImage = path.join(root, 'release', `Key-Buddy-${pkg.version}.AppImage`);
if (fs.existsSync(appImage)) {
  console.log(`\nReady: release/Key-Buddy-${pkg.version}.AppImage`);
  console.log('On Mint: chmod +x Key-Buddy-*.AppImage, then double-click or run ./Key-Buddy-*.AppImage\n');
}
