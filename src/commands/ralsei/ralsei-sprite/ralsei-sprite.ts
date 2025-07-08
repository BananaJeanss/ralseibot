import { SlashCommandBuilder, AttachmentBuilder, CommandInteraction } from 'discord.js';
import path from 'node:path';
import fs from 'node:fs';

const spritesFolder = path.join(__dirname, 'sprites', 'individual_sprites');
const ch12Folder = path.join(spritesFolder, 'ch12');
const ch34Folder = path.join(spritesFolder, 'ch34');

// Helper to check if a folder contains PNG files
function folderHasPngs(folder: string): boolean {
  return (
    fs.existsSync(folder) &&
    fs.readdirSync(folder).some((file) => file.endsWith('.png'))
  );
}

// Ensure at least one of the ch12 or ch34 folders exists and is not empty
if (!folderHasPngs(ch12Folder) && !folderHasPngs(ch34Folder)) {
  console.warn(
    '[ralsei-sprite warning] Neither ch12 nor ch34 folders contain PNG sprites:',
    ch12Folder,
    ch34Folder,
  );
  console.warn(
    '[ralsei-sprite warning] Run the extract-sprite.py script in the sprites folder to extract the sprites.',
  );
}

// Helper to recursively collect all PNG files
function getAllPngFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPngFiles(filePath));
    }
 else if (file.endsWith('.png')) {
      results.push(filePath);
    }
  }
  return results;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ralsei-sprite')
    .setDescription('Get a random Ralsei sprite from chapters 1-4'),
  async execute(interaction: CommandInteraction) {
    // Recursively get all PNG files
    const files = getAllPngFiles(spritesFolder);
    if (files.length === 0) {
      await interaction.reply('No sprites found!');
      return;
    }
    // Pick a random file
    const randomFile = files[Math.floor(Math.random() * files.length)];

    // Send as attachment
    const attachment = new AttachmentBuilder(randomFile, {
      name: path.basename(randomFile),
    });
    await interaction.reply({ files: [attachment] });
  },
};
