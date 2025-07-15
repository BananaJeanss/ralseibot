import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coin")
    .setDescription("Flip a coin to decide your fate"),
  async execute(interaction: ChatInputCommandInteraction) {
    const coinEmojis = {
      heads: "<:lightner:1394598249888743485>",
      tails: "<:darkner:1394598228514701363>",
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
