import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

const compliments = [
  // Ralsei-style compliments
  "You're as fluffy and kind as Ralsei himself!",
  "Your heart shines brighter than a Dark Fountain!",
  "You have the determination of a true Lightner!",
  "You're filled with so much kindness, Ralsei would be proud!",
  "Your friendship means more than all the Dark Crystals!",
  "You bring hope to the Dark World!",
  "You're as sweet as Ralsei's homemade cake!",
  "Your courage could defeat any King!",
  "You're the kind of friend everyone needs in their party!",
  "You're cooler than Susie with chalk!",
  "You're more reliable than Kris's sword!",
  "You're as loyal as Lancer!",
  "You're as charming as Spamton's [[DEALS]]!",
  "You're absolutely fantastic! ",
  "Your vibe is immaculate!",
  "You're the type of person who makes the world a little less dark!",
  "You've got main character energy!",
  "You're proof that kindness is the strongest magic!",
  "You're like a save point, always there when people need you most!",
  "Your presence makes every day feel like a field of hopes and dreams!",
  "You're the chosen one... of being absolutely wonderful!",
  "You've got that legendary equipment energy!",
  "You're rarer than finding a secret boss!",
];

export default {
  data: new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Send a compliment to someone, or yourself!")
    .addMentionableOption((option) =>
      option
        .setName("user")
        .setDescription("The user to compliment")
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getMentionable("user") || interaction.user;

    const randomCompliment =
      compliments[Math.floor(Math.random() * compliments.length)];

    const embed = new EmbedBuilder()
      .setColor("#4CAF50")
      .setTitle("A Compliment from Ralsei")
      .setDescription(`${randomCompliment}`);

    await interaction.reply({ embeds: [embed], content: `${user}` });
  },
};
