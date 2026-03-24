import { Events, Client } from "discord.js";
import { ServerCount } from "../metrics";

export function updateCount(client: Client) {
  if (client.shard) {
    // futureproofing fr, the bot may only be at 55 servers but what if tomorrow it has 2.5k servers
    client.shard.fetchClientValues("guilds.cache.size").then((results) => {
      const total = (results as number[]).reduce(
        (acc, count) => acc + count,
        0,
      );
      ServerCount.set(total);
    });
  } else {
    ServerCount.set(client.guilds.cache.size);
  }
}

export const guildCountAdded = {
  name: Events.GuildCreate,
  execute(guild: { client: Client }) {
    updateCount(guild.client);
  },
};

export const guildCountLeft = {
  name: Events.GuildDelete,
  execute(guild: { client: Client }) {
    updateCount(guild.client);
  },
};

export default [guildCountAdded, guildCountLeft];