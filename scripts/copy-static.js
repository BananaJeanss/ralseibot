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

// copy sprites
const srcRalsSprites = path.join(__dirname, '../src/commands/ralsei/ralsei-sprite/sprites/individual_sprites');
const destRalsSprites = path.join(__dirname, '../dist/commands/ralsei/ralsei-sprite/sprites/individual_sprites');

if (fs.existsSync(srcRalsSprites)) {
  fs.mkdirSync(path.dirname(destRalsSprites), { recursive: true });
  copyRecursiveSync(srcRalsSprites, destRalsSprites);
  console.log('Copied sprites to dist.');
} else {
  console.warn('Warning: individual_sprites directory not found at', srcRalsSprites);
}

// copy textbox sprites/files
const srcSprites = path.join(__dirname, '../src/commands/ralsei/textbox/sprites');
const destSprites = path.join(__dirname, '../dist/commands/ralsei/textbox/sprites');
if (fs.existsSync(srcSprites)) {
  fs.mkdirSync(destSprites, { recursive: true });
  copyRecursiveSync(srcSprites, destSprites);
  console.log('Copied textbox sprites');
}
else {
  console.warn('Warning: sprites directory not found at', srcSprites);
}