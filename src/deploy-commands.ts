import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const token = process.env.DISCORD_BOT_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: any[] = [];
const foldersPath = path.join(__dirname, 'commands');

async function loadCommands(dir: string) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      await loadCommands(itemPath);
    } else if (item.endsWith('.js')) {
      // Load command file using dynamic import
      try {
        const fileUrl = pathToFileURL(itemPath).href;
        const command = await import(fileUrl);
        const commandModule = command.default || command;

        if ('data' in commandModule && 'execute' in commandModule) {
          commands.push(commandModule.data.toJSON());
          console.log(`Loaded command: ${commandModule.data.name}`);
        } else {
          console.log(
            `[WARNING] The command at ${itemPath} is missing a required "data" or "execute" property.`,
          );
        }
      } catch (error) {
        console.error(`Error loading command ${itemPath}:`, error);
      }
    }
  }
}

await loadCommands(foldersPath);

const rest = new REST().setToken(token);

try {
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`,
  );

  const data = (await rest.put(Routes.applicationCommands(clientId), {
    body: commands,
  })) as any[];

  console.log(
    `Successfully reloaded ${data.length} application (/) commands.`,
  );
} catch (error) {
  console.error(error);
}
