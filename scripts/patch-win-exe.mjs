#!/usr/bin/env node
/**
 * Embed Key Buddy icon + product name into the unpacked app executable.
 * Do NOT patch the portable NSIS wrapper — rcedit corrupts that file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconIco = path.join(root, 'build', 'icon.ico');
const releaseDir = path.join(root, 'release');
const productName = 'Key Buddy';

async function patchExe(exePath) {
  if (!fs.existsSync(exePath)) {
    console.warn(`Skip patch (missing): ${exePath}`);
    return;
  }
  const rcedit = (await import('rcedit')).default;
  await rcedit(exePath, {
    icon: iconIco,
    'version-string': {
      ProductName: productName,
      FileDescription: productName,
      InternalName: productName,
      OriginalFilename: `${productName}.exe`,
      CompanyName: productName,
      LegalCopyright: productName,
    },
  });
  console.log(`Patched: ${path.relative(root, exePath)}`);
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('patch-win-exe: skipped (Windows only)');
    return;
  }
  if (!fs.existsSync(iconIco)) {
    throw new Error('build/icon.ico not found — run npm run generate:icons first');
  }

  await patchExe(path.join(releaseDir, 'win-unpacked', `${productName}.exe`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
