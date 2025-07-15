import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";

const downloadUrl =
  "https://raw.githubusercontent.com/HushBugger/hushbugger.github.io/refs/heads/master/deltarune/text/rendered.json";

// Cache the quotes in memory to avoid reading the file every time
let cachedQuotes: string[] | null = null;

// check if already downloaded
if (!fs.existsSync("./src/commands/ralsei/quote/quotes.json")) {
  // download the file
  fetch(downloadUrl)
    .then((res: { json: () => any }) => res.json())
    .then((data: any) => {
      fs.writeFileSync(
        "./src/commands/ralsei/quote/quotes.json",
        JSON.stringify(data, null, 2)
      );
      console.log("Quotes downloaded successfully.");
    })
    .catch((err: any) => console.error("Error downloading quotes:", err));
}

const cleanQuote = (quote: string): string => {
  return (
    quote
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      // Trim whitespace
      .trim()
  );
};

const loadQuotesIntoCache = () => {
  if (cachedQuotes) return;

  try {
    const data = JSON.parse(
      fs.readFileSync("./src/commands/ralsei/quote/quotes.json", "utf8")
    );
    const allEnQuotes: string[] = [];

    // collect all "en" values
    for (const chapter in data) {
      for (const section in data[chapter]) {
        for (const dialogueId in data[chapter][section]) {
          const dialogue = data[chapter][section][dialogueId];
          if (dialogue.en && dialogue.en.trim() !== "") {
            const cleaned = cleanQuote(dialogue.en);
            allEnQuotes.push(cleaned);
          }
        }
      }
    }

    cachedQuotes = allEnQuotes;
    console.log(`Loaded ${cachedQuotes.length} quotes into cache`);
    console.log(
      `Cache size: ${JSON.stringify(cachedQuotes).length} bytes (${(
        JSON.stringify(cachedQuotes).length /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );
  } catch (error) {
    console.error("Error loading quotes into cache:", error);
    cachedQuotes = [];
  }
};

const getRandomQuote = () => {
  // load quotes into cache to prevent long load times
  if (!cachedQuotes) {
    loadQuotesIntoCache();
  }

  if (cachedQuotes && cachedQuotes.length > 0) {
    return cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
  } else {
    return "No quotes found!";
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Get a completely random in-game line."),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const randomQuote = getRandomQuote();
      await interaction.editReply({
        content: `> ${randomQuote}`,
      });
    } catch (error) {
      console.error("Error in quote command:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.editReply({
          content: "Sorry, something went wrong getting a quote!",
        });
      }
    }
  },
};
