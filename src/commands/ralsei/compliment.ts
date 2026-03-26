import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

const compliments = [
  "You're as fluffy and kind as Ralsei!",
  "Your heart shines brighter than any Dark Fountain!",
  "Your DETERMINATION is stronger than everything!",
  "You're filled with so much kindness, Ralsei would be proud!",
  "Your friendship means more than all the Dark Crystals!",
  "You bring hope to the Dark World!",
  "Your courage could defeat any King!",
  "You're the kind of friend everyone needs in their party!",
  "You're as funny as Lancer!",
  "You're as charming as Spamton's [[DEALS]]!",
  "You're absolutely fantastic! ",
  "Your vibe is immaculate!",
  "You're the type of person who makes the world a little less dark!",
  "You've got main character energy!",
  "You're proof that kindness is the strongest magic!",
  "You're like a save point, always there when people need you most!",
  "Your presence makes every day feel like a field of hopes and dreams!",
  "You're the chosen one... of being absolutely wonderful!",
  "If The Roaring ever happened, you'd be the light to stop it!",
  "You're the SOUL of the party!",
  "You're as persuasive as an Addison!",
  "If you were Ramb, I'd shed an tear for you!",
  "You're smarter than Rouxls Kaard!",
  "You're as cute as a Tasque!",
  "Tenna could never match your energy!",
  "If the prophecy was about you, it would be about how you bring light to the darkest places!",
  "You're as tough as the watercooler!",
  "You are the original       Starwalker",
  "You're as loyal as a Swatchling!",
  "The Hammer of Justice? Must be named after you!",
  "Top Chef could never compare to your cooking skills!",
  "You're as unique as Noelle!",
  "You're as mysterious and cool as The Roaring Knight!",
  "You're as strong and determined as Undyne!",
  "Jockington could never match your charisma!",
  "You're the FRIEND of this world!"
];

export default {
  data: new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Send a compliment to someone, or yourself!")
    .addMentionableOption((option) =>
      option
        .setName("user")
        .setDescription("The user to compliment")
        .setRequired(false),
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
