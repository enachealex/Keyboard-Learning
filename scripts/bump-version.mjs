#!/usr/bin/env node
/**
 * Bump package.json version before a new portable .exe release.
 * Usage:
 *   npm run bump:version          # 1.0.0 → 1.0.1
 *   npm run bump:version -- minor   # 1.0.1 → 1.1.0
 *   npm run bump:version -- major   # 1.1.0 → 2.0.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');

function parseVersion(version) {
  const parts = version.split('.').map((n) => Number.parseInt(n, 10) || 0);
  return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bump(version, kind) {
  const v = parseVersion(version);
  if (kind === 'major') {
    return formatVersion({ major: v.major + 1, minor: 0, patch: 0 });
  }
  if (kind === 'minor') {
    return formatVersion({ major: v.major, minor: v.minor + 1, patch: 0 });
  }
  return formatVersion({ major: v.major, minor: v.minor, patch: v.patch + 1 });
}

const kind = process.argv[2] === 'major' || process.argv[2] === 'minor'
  ? process.argv[2]
  : 'patch';

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const previous = pkg.version;
const next = bump(previous, kind);
pkg.version = next;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Version: ${previous} → ${next}`);
console.log(`Next portable exe: release/Keyboard-Learning-${next}-portable.exe`);
console.log('GitHub release tag: v' + next);
