import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';
import { config } from 'dotenv';
import { envCheck } from './events/envCheck';
config();
envCheck();

interface Command {
    data: SlashCommandBuilder;
    execute: (...args: unknown[]) => Promise<void> | void;
}

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, Command>;
        cooldowns: Collection<string, Collection<string, number>>;
    }
}

const token = process.env.DISCORD_BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.cooldowns = new Collection(); // store cooldowns for commands
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
                client.commands.set(command.data.name, command);
                console.log(`Loaded command: ${command.data.name}`);
            }
 else {
                console.log(`[WARNING] The command at ${itemPath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}
loadCommands(foldersPath);

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));


for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
 else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);