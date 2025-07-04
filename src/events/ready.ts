import { Client, Events } from 'discord.js';
import { startRotatingStatus } from './rotateStatus';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		console.log(`Ralseibot ready! Logged in as ${client.user?.tag}`);
		startRotatingStatus(client);
	},
};