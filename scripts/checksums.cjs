/**
 * electron-builder afterAllArtifactBuild hook: write a .sha256 file next
 * to each built .exe so schools and IT departments can independently
 * verify their download. The returned paths are attached to GitHub
 * releases alongside the installers.
 *
 * Verify on Windows with:  certutil -hashfile <installer.exe> SHA256
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

exports.default = async function checksums(buildResult) {
  const extraFiles = [];
  for (const artifact of buildResult.artifactPaths ?? []) {
    if (!artifact.toLowerCase().endsWith('.exe')) continue;
    const sumPath = `${artifact}.sha256`;
    fs.writeFileSync(sumPath, `${sha256(artifact)} *${path.basename(artifact)}\n`);
    console.log(`  • checksum written  ${path.basename(sumPath)}`);
    extraFiles.push(sumPath);
  }
  return extraFiles;
};
