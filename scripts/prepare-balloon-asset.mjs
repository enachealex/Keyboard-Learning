#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fallback = path.join(root, 'src', 'assets', 'balloon-source.png');
const out = path.join(root, 'src', 'assets', 'balloon.png');

const src = process.argv[2] && fs.existsSync(process.argv[2]) ? process.argv[2] : fallback;
if (!fs.existsSync(src)) {
  console.log('Balloon source missing — skip (use existing src/assets/balloon.png)');
  process.exit(0);
}

const { default: sharp } = await import('sharp');
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r < 30 && g < 30 && b < 30) data[i + 3] = 0;
}

await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png().toFile(out);

console.log(`Balloon asset ready: ${path.relative(root, out)} (${info.width}x${info.height})`);
