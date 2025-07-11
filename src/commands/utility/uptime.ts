import { SlashCommandBuilder, CommandInteraction } from "discord.js";

const formattedUptime = (() => {
  const uptime = process.uptime();
  const uptimeDays = Math.floor(uptime / 86400);
  const uptimeHours = Math.floor((uptime % 86400) / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);

  return `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;
})();


export default {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Replies with the bot's uptime"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({
      content: `Uptime: ${formattedUptime}`,
    });
  },
};