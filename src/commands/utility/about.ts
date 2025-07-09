import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";

const uptime = process.uptime();
const uptimeHours = Math.floor(uptime / 3600);
const uptimeMinutes = Math.floor((uptime % 3600) / 60);
const uptimeSeconds = Math.floor(uptime % 60);
const formattedUptime = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("Replies with information about the bot"),
  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("ralseibot")
      .setURL("https://github.com/BananaJeanss/ralseibot")
      .setDescription("A general-purpose ralsei-themed Discord bot")
      .setColor("#26a269")
      .addFields(
        {
          name: "Commands",
          value: [
            "`/ralsei` - Random Ralsei images from Reddit & Twitter",
            "`/ralsei-sprite` - Random sprites from chapters 1-4",
            "`/textbox` - Generate textboxes with different sprites",
            "`/ping` - Check bot responsiveness",
          ].join("\n"),
          inline: false,
        },
        {
          name: "Features",
          value: [
            "• /ralsei content from multiple sources",
            "• Basic textbox generation",
            "• Auto-rotating status messages",
            "• Built with TypeScript & Discord.js",
          ].join("\n"),
          inline: false,
        },
        {
          name: "Stats",
          value: [
            `Servers: ${interaction.client.guilds.cache.size}`,
            `Uptime: <t:${Math.floor(
              (Date.now() - process.uptime() * 1000) / 1000
            )}:R>`,
          ].join("\n"),
          inline: true,
        },
      )

    await interaction.reply({ embeds: [embed] });
  },
};
