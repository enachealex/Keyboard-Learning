/**
 * electron-builder afterPack hook: sign the packaged app executable(s)
 * as "The Jump Vault".
 *
 * The main exe can't go through the normal signing path on this machine
 * (signAndEditExecutable is off because extracting electron-builder's
 * winCodeSign toolkit needs symlink privileges Windows doesn't grant by
 * default), so we sign it here, after packaging and the asar-integrity
 * stamp, before the installer wraps it.
 */
const path = require('node:path');
const fs = require('node:fs');
const { signFile } = require('./sign-win.cjs');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const entries = fs.readdirSync(context.appOutDir);
  for (const entry of entries) {
    if (entry.toLowerCase().endsWith('.exe')) {
      signFile(path.join(context.appOutDir, entry));
    }
  }
};
