#!/usr/bin/env node
/**
 * Safely embed Key Buddy icon into the portable NSIS launcher (rcedit corrupts SFX exes).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as PELibrary from 'pe-library';
import * as ResEdit from 'resedit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const productName = 'Key Buddy';

function patchPortableExe(portablePath, iconIco) {
  const beforeSize = fs.statSync(portablePath).size;
  if (beforeSize < 10_000_000) {
    throw new Error(
      `Portable exe looks too small (${beforeSize} bytes) — rebuild before patching icon`,
    );
  }

  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconIco));
  const icons = iconFile.icons.map((item) => item.data);

  const data = fs.readFileSync(portablePath);
  const exe = PELibrary.NtExecutable.from(data, { ignoreCert: true });
  const res = PELibrary.NtExecutableResource.from(exe);
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);

  if (groups.length === 0) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, icons);
  } else {
    for (const group of groups) {
      ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
        res.entries,
        group.id,
        group.lang,
        icons,
      );
    }
  }

  const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  if (viList.length > 0) {
    const vi = viList[0];
    vi.setStringValues(
      { lang: 1033, codepage: 1200 },
      {
        FileDescription: productName,
        ProductName: productName,
        InternalName: productName,
        OriginalFilename: `${productName}.exe`,
        CompanyName: productName,
      },
    );
    vi.outputToResourceEntries(res.entries);
  }

  res.outputResource(exe);
  const tempPath = `${portablePath}.iconpatch.exe`;
  fs.writeFileSync(tempPath, Buffer.from(exe.generate()));
  fs.renameSync(tempPath, portablePath);

  const afterSize = fs.statSync(portablePath).size;
  console.log(
    `Portable icon patched: ${path.basename(portablePath)} (${Math.round(beforeSize / 1e6)}MB, size delta ${afterSize - beforeSize} bytes)`,
  );
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('patch-portable-icon: skipped (Windows only)');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const portablePath = path.join(
    root,
    'release',
    `Keyboard-Learning-${pkg.version}-portable.exe`,
  );
  const iconIco = path.join(root, 'build', 'icon.ico');

  if (!fs.existsSync(portablePath)) {
    console.warn(`Portable exe not found: ${portablePath}`);
    return;
  }
  if (!fs.existsSync(iconIco)) {
    throw new Error('build/icon.ico not found — run npm run generate:icons first');
  }

  patchPortableExe(portablePath, iconIco);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
