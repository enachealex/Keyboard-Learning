#!/usr/bin/env node
/**
 * Build and pack a portable Linux folder (and .zip) for the kids' laptop.
 * Kids launch via app menu after one-time ./install-desktop.sh
 * Run: npm run package:linux
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outName = 'key-buddy-linux';
const outDir = path.join(root, 'release', outName);
const distDir = path.join(root, 'dist');
const iconSrc = path.join(root, 'build', 'icon.png');

function rm(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) cpDir(s, d);
    else cp(s, d);
  }
}

console.log('Building game...');
execSync('npm run generate:icons', { cwd: root, stdio: 'inherit' });
execSync('npm run build', { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('Build failed: dist/index.html not found');
  process.exit(1);
}

console.log('Packing Linux release...');
rm(outDir);
fs.mkdirSync(outDir, { recursive: true });

cpDir(distDir, outDir);
cp(path.join(__dirname, 'KeyBuddy-linux.sh'), path.join(outDir, 'KeyBuddy.sh'));
cp(path.join(__dirname, 'install-desktop-linux.sh'), path.join(outDir, 'install-desktop.sh'));
cp(path.join(__dirname, 'key-buddy.desktop'), path.join(outDir, 'key-buddy.desktop'));
cp(path.join(__dirname, 'linux-release-README.txt'), path.join(outDir, 'README.txt'));
if (fs.existsSync(iconSrc)) {
  cp(iconSrc, path.join(outDir, 'icon.png'));
}

for (const sh of ['KeyBuddy.sh', 'install-desktop.sh']) {
  const p = path.join(outDir, sh);
  const text = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  fs.writeFileSync(p, text, 'utf8');
}

const zipPath = path.join(root, 'release', `${outName}.zip`);
try {
  rm(zipPath);
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${path.join(root, 'release')}" && zip -r "${outName}.zip" "${outName}"`, {
      stdio: 'inherit',
    });
  }
  console.log(`\nZip: ${zipPath}`);
} catch {
  console.log('\nZip skipped (folder ready without archive).');
}

console.log(`\nDone! Transfer to the Linux laptop:\n  ${outDir}`);
console.log('On Mint (one-time): chmod +x KeyBuddy.sh install-desktop.sh && ./install-desktop.sh');
console.log('Then kids launch "Key Buddy" from the app menu.\n');
