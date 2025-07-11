import { Client, Events } from 'discord.js';
import { startRotatingStatus } from './rotateStatus.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		console.log(`Ralseibot ready! Logged in as ${client.user?.tag}`);
		startRotatingStatus(client);
	},
};