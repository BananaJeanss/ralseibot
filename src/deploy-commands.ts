import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

config();
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error(
    'Missing required environment variables: DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID',
  );
}

const commands: any[] = [];
const foldersPath = path.join(__dirname, 'commands');

function loadCommands(dir: string) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      loadCommands(itemPath);
    }
 else if (item.endsWith('.ts') || item.endsWith('.js')) {
      // Load command file
      const command = require(itemPath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Loaded command: ${command.data.name}`);
      }
 else {
        console.log(
          `[WARNING] The command at ${itemPath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }
}

loadCommands(foldersPath);

const rest = new REST().setToken(token);

(async () => {
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
  }
 catch (error) {
    console.error(error);
  }
})();
