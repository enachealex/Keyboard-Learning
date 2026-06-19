#!/usr/bin/env node
/**
 * Rasterize build/logo.svg → PNG icons for Electron, favicon, and packaged window.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'build', 'logo.svg');
const iconPath = path.join(root, 'build', 'icon.png');
const iconIcoPath = path.join(root, 'build', 'icon.ico');
const publicLogo = path.join(root, 'public', 'logo.png');
const electronIcon = path.join(root, 'electron', 'icon.png');
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  const { default: sharp } = await import('sharp');
  const toIco = (await import('to-ico')).default;
  const svg = fs.readFileSync(svgPath);
  const png = await sharp(svg).resize(512, 512).png().toBuffer();
  const icoInputs = await Promise.all(
    ICO_SIZES.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
  );
  const ico = await toIco(icoInputs);

  fs.mkdirSync(path.dirname(iconPath), { recursive: true });
  fs.writeFileSync(iconPath, png);
  fs.writeFileSync(iconIcoPath, ico);
  fs.mkdirSync(path.dirname(publicLogo), { recursive: true });
  fs.writeFileSync(publicLogo, png);
  fs.mkdirSync(path.dirname(electronIcon), { recursive: true });
  fs.writeFileSync(electronIcon, png);

  console.log('Icons generated: build/icon.png, build/icon.ico, public/logo.png, electron/icon.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
