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

const srcSprites = path.join(__dirname, '../src/commands/ralsei/ralsei-sprite/sprites/individual_sprites');
const destSprites = path.join(__dirname, '../dist/commands/ralsei/ralsei-sprite/sprites/individual_sprites');

copyRecursiveSync(srcSprites, destSprites);
console.log('Copied sprites to dist.');