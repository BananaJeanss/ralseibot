import fs from "node:fs";
import path from "node:path";
import {
  Client,
  Collection,
  GatewayIntentBits,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "dotenv";
import { envCheck } from "./events/envCheck.js";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { startServer } from "./site/express.js";
config();
envCheck();

interface Command {
  data: SlashCommandBuilder;
  execute: (...args: unknown[]) => Promise<void> | void;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}

const token = process.env.DISCORD_BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.cooldowns = new Collection(); // store cooldowns for commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const foldersPath = path.join(__dirname, "commands");

async function loadCommands(dir: string) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      await loadCommands(itemPath);
    } else if (item.endsWith(".ts") || item.endsWith(".js")) {
      // Load command file using dynamic import
      try {
        const fileUrl = pathToFileURL(itemPath).href;
        const command = await import(fileUrl);
        const commandModule = command.default || command;

        if ("data" in commandModule && "execute" in commandModule) {
          client.commands.set(commandModule.data.name, commandModule);
          console.log(`Loaded command: ${commandModule.data.name}`);
        } else {
          console.log(
            `[WARNING] The command at ${itemPath} is missing a required "data" or "execute" property.`
          );
        }
      } catch (error) {
        console.error(`Error loading command ${itemPath}:`, error);
      }
    }
  }
}

async function loadEvents() {
  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const event = await import(fileUrl);
      const eventModule = event.default || event;

      if (eventModule.once) {
        client.once(eventModule.name, (...args) =>
          eventModule.execute(...args)
        );
      } else {
        client.on(eventModule.name, (...args) => eventModule.execute(...args));
      }
    } catch (error) {
      console.error(`Error loading event ${filePath}:`, error);
    }
  }
}

const runMode = process.env.RUN_MODE || "dual";

async function main() {
  await loadEvents();

  console.log(`Running in ${runMode} mode`);
  if (runMode === "site" || runMode === "dual") {
    console.log("Starting express site");
    startServer();
  }
  if (runMode === "bot" || runMode === "dual") {
    console.log("Loading commands");
    await loadCommands(foldersPath);
    client.login(token);
  }
}

main().catch(console.error);
