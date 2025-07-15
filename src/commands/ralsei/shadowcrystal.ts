import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

const responses = [
  // POSITIVE RESPONSES
  "Proceed",
  "Hey, this is pretty good!",
  "EXCELLENT.",
  "WELL DONE.",
  "THE HALFWAY MARK HAS BEEN ATTAINED.",
  "MARVELOUS!!! Mike, rebuild the set!! Rebuild my kids!!",
  "Look Kris!! We won!!! We won!!!",
  "AAA!? They're already SCREAMING from DELIGHT, folks!!!",
  "Finally some convenience.",
  "Don't give up, heroes!! Think of the ratings!!!",
  "I'M GOING TO GIVE YOU GUYS A MASSIVE BONUS AFTER THIS!",
  "(Noelle joined the party!)",
  "Cool Mixtape",
  "Alright, sure. We'll give it a shot.",

  // NEGATIVE RESPONSES
  "Don't be blue.",
  "you should probably hesitate more.",
  "... No?",
  "(... not like this.)",
  "Oops.",
  "Trust me... you dodged a bullet.",
  "I haveth noe idea who won or lost.",
  "No!! And now a WORM from our sponsors!!!",
  "Well, too bad! You got Z-Rank, didn't you?",
  "...GO BACK ... YOUR TAKING... TOO LONG...",
  "NO!!! THE LAIGHT!! DON'T BROING IT CLOASE TO MY FAICE!!!",
  "I'm old!",
  "You were just trying to make Berdly mad, weren't you!?",
  "Kris You Are Going To Get Sick",
  "Now You Will Become Potassium Deficient",

  // NEUTRAL/INFORMATIONAL RESPONSES
  "Eat Moss",
  "You found the [Moss]!",
  "[[Hyperlink Blocked]].",
  "YOU'RE  LIGHT neR< AREN'T YOU?",
  "EV3RY  BUDDY  'S FAVORITE [[Number 1 Rated Salesman1997]]",
  "THAT'S RIGHT!! NOW'S YOUR CHANCE TO BE A [[BIG SHOT]]!!",
  "[Turn Up The JUICE!]",
  "Damn... I dunno what this axe is, but it looks awesome!",
  "Smells like a model house set.",
  "CUT THE BATTLE!!!",
  "(You retained the title of Bed Inspector.)",
  "(The door is locked.)",
  "(Nothing happened.)",
  "(Aww, Kris wants walkies...?)",
  "(The A-rank room... it's shut tightly with aluminum bars.)",
  "(The B-rank room... it's shut tightly with barium bars.)",
  "(The C-rank room... it's shut tightly with carbon-fiber bars.)",
  "Did you seek something from me?",
  "The Roaring Knight appeared.",
  "Give me a K! Give me an R!",
  "Go...  t... team?",
  "* Everyone chatted around the watercooler.",
  "We're ALL a little GLOOBY sometimes!!",
  "IT'S! TV! TIME!",
  "* (You found a FlatSoda.)",
  "OK There's Nothing Wrong With Him He's Just Annoying",
  "Toodles",
  "Kris Be A Dear And Go Press The Walk Button",
  "Kris Get The Banana",
  "Here Comes A Crossing Get Ready To Stop",
  "Potassium",
];

export default {
  data: new SlashCommandBuilder()
    .setName("shadowcrystal")
    .setDescription("Ask the magic shadow crystal a question")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question you want to ask the magic shadow crystal")
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setColor("#0F7F00")
      .setTitle("Magic shadow crystal")
      .setThumbnail("https://deltarune.wiki/images/Shadow_Crystal_item.png?cb=3rjdhe")
      .setDescription(`**Question:** ${question}\n\n**Answer:** ${response}`)

    await interaction.reply({ embeds: [embed] });
  }
};