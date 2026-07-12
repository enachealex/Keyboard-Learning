/**
 * electron-builder afterPack hook: harden, then sign, the packaged app
 * executable(s) — in that order, so the Authenticode hash covers the
 * final bytes. (electron-builder's own electronFuses config runs AFTER
 * afterPack and would invalidate our signature, so we flip fuses here.)
 *
 * Fuses: the exe can't be repurposed as a Node runtime (RunAsNode,
 * NODE_OPTIONS, --inspect all off), only loads the packaged app.asar,
 * and validates that archive's embedded integrity hash at startup — so
 * tampering with the installed app's code stops it from launching.
 */
const path = require('node:path');
const fs = require('node:fs');
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const { signFile } = require('./sign-win.cjs');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const entries = fs.readdirSync(context.appOutDir);
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith('.exe')) continue;
    const exePath = path.join(context.appOutDir, entry);
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
