#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const fallback = path.join(root, 'src', 'assets', 'pop-burst-source.png');
const out = path.join(root, 'src', 'assets', 'pop-burst.png');

const src = process.argv[2] && fs.existsSync(process.argv[2]) ? process.argv[2] : fallback;
if (!fs.existsSync(src)) {
  console.log('Pop effect source missing — skip (use existing src/assets/pop-burst.png)');
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

const targetSize = 256;
await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .resize(targetSize, targetSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log(`Pop effect ready: ${path.relative(root, out)} (${targetSize}x${targetSize})`);
