import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("commands")
    .setDescription("View available bot commands"),
  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("ralseibot Commands")
      .setColor("#4CAF50")
      .setDescription("Here are some popular commands:")
      .addFields(
        {
          name: "Popular Commands",
          value: [
            "`/ralsei` - Random Ralsei images from Reddit & Twitter",
            "`/ralsei-sprite` - Random sprites from chapters 1-4",
            "`/textbox` - Generate textboxes with different sprites",
            "`/compliment` - Send a heartwarming compliment",
            "`/shadowcrystal` - Ask the magic shadow crystal a question",
          ].join("\n"),
          inline: false,
        },
        {
          name: "Utility Commands",
          value: [
            "`/ping` - Check bot responsiveness",
            "`/uptime` - View bot uptime",
            "`/about` - Bot information",
          ].join("\n"),
          inline: false,
        },
        {
          name: "📖 Full Command List",
          value:
            "For a complete list of all commands and their descriptions, visit:\n[**commands.md**](https://github.com/BananaJeanss/ralseibot/blob/main/commands.md)",
          inline: false,
        }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
