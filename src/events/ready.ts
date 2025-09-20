import { Client, Events } from 'discord.js';
import { startRotatingStatus } from './rotateStatus.js';
import { getVoiceConnections } from '@discordjs/voice';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client: Client) {
		console.log(`🍏 Ralseibot ready! Logged in as ${client.user?.tag}`);

		// leave any VCs on restart
		for (const [, guild] of client.guilds.cache) {
			const me = guild.members.me;
			let vcCount = 0;
			if (me?.voice.channel) {
				me.voice.disconnect()
					.then(() => {
						vcCount++;
					})
					.catch(console.error);
			}
			if (vcCount > 0) {
				console.log(`🔉 Left ${vcCount} voice channel(s) on restart`);
			}
			getVoiceConnections().forEach((c) => c.destroy());
		}

		startRotatingStatus(client);
	},
};