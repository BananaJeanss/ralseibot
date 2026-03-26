import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coin")
    .setDescription("Flip a coin to decide your fate"),
  async execute(interaction: ChatInputCommandInteraction) {
    const coinEmojis = {
      heads: "<:lightnercoin:1486700259785838602>",
      tails: "<:darknercoin:1486700248200904795>",
    };
    await interaction.reply("🪙 Flipping the coin...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    await interaction.editReply(
      `${
        coinEmojis[result.toLowerCase() as keyof typeof coinEmojis]
      } The coin landed on **${result}**!`
    );
  },
};
