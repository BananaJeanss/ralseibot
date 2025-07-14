import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// copy public static files
const srcPublic = path.join(__dirname, '../src/site/public');
const destPublic = path.join(__dirname, '../dist/site/public');
copyRecursiveSync(srcPublic, destPublic);
console.log('Copied static files to dist.');

// copy ralsei.png
const srcRalsei = path.join(__dirname, '../src/commands/ralsei/ralseify/ralsei.png');
const destRalsei = path.join(__dirname, '../dist/commands/ralsei/ralseify/ralsei.png');
if (fs.existsSync(srcRalsei)) {
  fs.mkdirSync(path.dirname(destRalsei), { recursive: true });
  fs.copyFileSync(srcRalsei, destRalsei);
  console.log('Copied ralsei.png for ralseify command.');
} else {
  console.warn('Warning: ralsei.png not found at', srcRalsei);
}