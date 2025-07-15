import { createCanvas, loadImage } from "canvas";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";

const motivationalQuotes = [
  "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
  "The only way to do great work is to love what you do.",
  "Life is about making an impact, not making an income.",
  "Whatever the mind of man can conceive and believe, it can achieve.",
  "Strive not to be a success, but rather to be of value.",
  "Two roads diverged in a wood, and I—I took the one less traveled by, And that has made all the difference.",
  "I attribute my success to this: I never gave or took any excuse.",
  "You miss 100% of the shots you don’t take.",
  "I've missed more than 9000 shots in my career. I've lost almost 300 games. 26 times I've been trusted to take the game winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.",
  "The most difficult thing is the decision to act, the rest is merely tenacity.",
  "Every strike brings me closer to the next home run.",
  "Definiteness of purpose is the starting point of all achievement.",
  "Life isn't about getting and having, it's about giving and being.",
  "Life is what happens to you while you’re busy making other plans.",
  "We become what we think about.",
  "Twenty years from now you will be more disappointed by the things that you didn’t do than by the ones you did do, so throw off the bowlines, sail away from safe harbor, catch the trade winds in your sails.  Explore, Dream, Discover.",
  "Life is 10% what happens to me and 90% of how I react to it.",
  "The most common way people give up their power is by thinking they don’t have any.",
  "The mind is everything. What you think you become.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "An unexamined life is not worth living.",
  "Eighty percent of success is showing up.",
  "Your time is limited, so don’t waste it living someone else’s life.",
  "Winning isn’t everything, but wanting to win is.",
  "I am not a product of my circumstances. I am a product of my decisions.",
  "Every child is an artist.  The problem is how to remain an artist once he grows up.",
  "You can never cross the ocean until you have the courage to lose sight of the shore.",
  "I’ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
  "Either you run the day, or the day runs you.",
  "Whether you think you can or you think you can’t, you’re right.",
  "The two most important days in your life are the day you are born and the day you find out why.",
  "Whatever you can do, or dream you can, begin it.  Boldness has genius, power and magic in it.",
  "The best revenge is massive success.",
  "People often say that motivation doesn’t last. Well, neither does bathing.  That’s why we recommend it daily.",
  "Life shrinks or expands in proportion to one's courage.",
  "If you hear a voice within you say “you cannot paint,” then by all means paint and that voice will be silenced.",
  "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.",
  "Ask and it will be given to you; search, and you will find; knock and the door will be opened for you.",
  "The only person you are destined to become is the person you decide to be.",
  "Go confidently in the direction of your dreams.  Live the life you have imagined.",
  "When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.",
  "Few things can help an individual more than to place responsibility on him, and to let him know that you trust him.",
  "Certain things catch your eye, but pursue only those that capture the heart.",
  "Believe you can and you’re halfway there.",
  "Everything you’ve ever wanted is on the other side of fear.",
  "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.",
  'Teach thy tongue to say, "I do not know," and thous shalt progress.',
  "Start where you are. Use what you have.  Do what you can.",
  "When I was 5 years old, my mother always told me that happiness was the key to life.  When I went to school, they asked me what I wanted to be when I grew up.  I wrote down ‘happy’.  They told me I didn’t understand the assignment, and I told them they didn’t understand life.",
  "Fall seven times and stand up eight.",
  "When one door of happiness closes, another opens, but often we look so long at the closed door that we do not see the one that has been opened for us.",
  "Everything has beauty, but not everyone can see.",
  "How wonderful it is that nobody need wait a single moment before starting to improve the world.",
  "When I let go of what I am, I become what I might be.",
  "Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
  "Happiness is not something readymade.  It comes from your own actions.",
  "If you're offered a seat on a rocket ship, don't ask what seat! Just get on.",
  "First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, materials, and methods. Third, adjust all your means to that end.",
  "If the wind will not serve, take to the oars.",
];

const backgroundImages = fs
  .readdirSync("./src/commands/ralsei/motivational-quote/backgrounds")
  .filter(
    (file) =>
      file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg")
  );

export default {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("motivational-quote")
    .setDescription("Get a image of a motivational quote"),
  async execute(interaction: ChatInputCommandInteraction) {
    const backgroundImage =
      backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    const quote =
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const canvasSize = 500;
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext("2d");

    // Load the background image
    const background = await loadImage(
      `./src/commands/ralsei/motivational-quote/backgrounds/${backgroundImage}`
    );
    ctx.drawImage(background, 0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent overlay
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Set text properties
    ctx.fillStyle = "white";
    ctx.font = "bold 28px 'Franklin Gothic Medium'"
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // wrap text
    const words = quote.split(" ");
    let line = "";
    const lines: string[] = [];
    const lineHeight = 30;
    const maxWidth = canvasSize - 40;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Draw each line, vertically centered
    const totalHeight = lines.length * lineHeight;
    let y = canvasSize / 2 - totalHeight / 2 + lineHeight / 2;

    for (const l of lines) {
      ctx.fillText(l, canvasSize / 2, y, maxWidth);
      y += lineHeight;
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");
    const attachment = {
      files: [
        {
          attachment: buffer,
          name: "motivational-quote.png",
        },
      ],
    };
    await interaction.reply({ files: attachment.files });
  },
};
