/**
 * electron-builder afterPack hook — the full Windows exe pipeline, in the
 * only order that works: brand, then fuse, then sign.
 *
 * 1. Brand: stamp The Jump Vault version resources + Key Buddy icon into
 *    the exe (electron-builder's own signAndEditExecutable can't be used:
 *    its editor runs after this hook and refuses already-signed binaries).
 * 2. Fuses: the exe can't be repurposed as a Node runtime (RunAsNode,
 *    NODE_OPTIONS, --inspect all off), only loads the packaged app.asar,
 *    and validates that archive's embedded hash at startup.
 * 3. Sign: Authenticode last, so the hash covers the final bytes.
 *
 * The NSIS installer/uninstaller are signed separately via
 * win.signtoolOptions.sign — never rcedit those (it corrupts them).
 */
const path = require('node:path');
const fs = require('node:fs');
const rcedit = require('rcedit');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const { signFile } = require('./sign-win.cjs');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const { appInfo } = context.packager;
  const iconIco = path.join(context.packager.projectDir, 'build', 'icon.ico');

  const entries = fs.readdirSync(context.appOutDir);
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith('.exe')) continue;
    const exePath = path.join(context.appOutDir, entry);

    await rcedit(exePath, {
      icon: iconIco,
      'file-version': appInfo.version,
      'product-version': appInfo.version,
      'version-string': {
        CompanyName: 'The Jump Vault',
        ProductName: appInfo.productName,
        FileDescription: appInfo.productName,
        InternalName: appInfo.productName,
        OriginalFilename: entry,
        LegalCopyright: appInfo.copyright,
      },
    });
    console.log(`  • branded as The Jump Vault  ${exePath}`);

    await flipFuses(exePath, {
      version: FuseVersion.V1,
      resetAdHocDarwinSignature: false,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    });
    console.log(`  • fuses hardened  ${exePath}`);

    signFile(exePath);
  }
};
