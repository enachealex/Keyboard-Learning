/**
 * Authenticode signing for Windows builds — signs as "The Jump Vault".
 *
 * Used two ways:
 *  1. electron-builder custom sign hook (win.sign in the builder config):
 *     signs the app exe, uninstaller, and installer during packaging.
 *  2. CLI: `node scripts/sign-win.cjs <file.exe> [more.exe...]`
 *
 * Certificate resolution order:
 *  - JV_SIGN_PFX (+ JV_SIGN_PASSWORD) env vars pointing at a .pfx —
 *    use this for a CA-issued certificate or CI.
 *  - Otherwise the CurrentUser\My store, newest code-signing cert whose
 *    subject contains "The Jump Vault" (the local self-signed cert).
 *
 * If no certificate is available the build continues unsigned with a
 * warning, so contributors without the cert can still package.
 */
const { spawnSync } = require('node:child_process');

// Substring match on purpose: it finds both the current self-signed cert
// (CN=The Jump Vault) and the future CA-issued one (CN=Jump Vault LLC).
const SUBJECT_MATCH = 'Jump Vault';
const TIMESTAMP_SERVER = 'http://timestamp.digicert.com';

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function signFile(filePath) {
  const pfx = process.env.JV_SIGN_PFX;
  const pfxPassword = process.env.JV_SIGN_PASSWORD ?? '';

  const certScript = pfx
    ? `$cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(${psQuote(pfx)}, ${psQuote(pfxPassword)})`
    : `$cert = Get-ChildItem Cert:\\CurrentUser\\My -CodeSigningCert |
        Where-Object { $_.Subject -match ${psQuote(SUBJECT_MATCH)} } |
        Sort-Object NotAfter -Descending | Select-Object -First 1`;

  const script = `
    $ErrorActionPreference = 'Stop'
    ${certScript}
    if (-not $cert) { Write-Output 'NO_CERT'; exit 0 }
    $r = Set-AuthenticodeSignature -FilePath ${psQuote(filePath)} -Certificate $cert -HashAlgorithm SHA256 -TimestampServer ${psQuote(TIMESTAMP_SERVER)}
    # UnknownError = signed fine but the chain isn't trusted on this machine,
    # which is expected for the self-signed cert.
    if ($r.Status -in @('Valid', 'UnknownError')) { Write-Output ('SIGNED ' + $r.Status) }
    else { Write-Output ('FAILED ' + $r.Status + ' ' + $r.StatusMessage); exit 1 }
  `;

  const res = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    encoding: 'utf8',
    timeout: 120000,
  });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim();

  if (out.includes('NO_CERT')) {
    console.warn(`  ! sign-win: no "${SUBJECT_MATCH}" certificate found — leaving unsigned: ${filePath}`);
    return;
  }
  if (res.status !== 0 || !out.includes('SIGNED')) {
    throw new Error(`sign-win failed for ${filePath}: ${out}`);
  }
  console.log(`  • signed as "${SUBJECT_MATCH}"  ${filePath}`);
}

/** electron-builder sign hook. */
exports.default = async function sign(configuration) {
  signFile(configuration.path);
};

exports.signFile = signFile;

// CLI mode
if (require.main === module) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node scripts/sign-win.cjs <file.exe> [more...]');
    process.exit(1);
  }
  for (const f of files) signFile(f);
}
