import { Client, Events } from "discord.js";
import { startRotatingStatus } from "./rotateStatus.js";
import { updateCount } from "./guildCount.js";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`🍏 Ralseibot ready! Logged in as ${client.user?.tag}`);
    
    // init prometheus member count
    updateCount(client);
    setInterval(() => updateCount(client), 15 * 60 * 1000);

    // rotate statuses
    startRotatingStatus(client);
  },
};
