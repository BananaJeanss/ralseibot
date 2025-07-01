import { Client, ActivityType } from "discord.js";

export function startRotatingStatus(
  client: Client,
  intervalMs = 30000
) {
  const statuses = [
    { type: ActivityType.Playing, text: "with Ralsei" },
    { type: ActivityType.Watching, text: "the stars" },
    { type: ActivityType.Playing, text: "DELTARUNE"},
    { type: ActivityType.Listening, text: "Cool Mixtape" }
  ];


  let i = 0;
  setInterval(() => {
    try {
        client.user?.setActivity(statuses[i % statuses.length].text, { type: statuses[i % statuses.length].type });
    } catch (error) {
        console.error("Error setting activity:", error);
    }
    i++;
  }, intervalMs);
}
