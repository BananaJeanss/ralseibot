import {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
} from "discord.js";
import { RedditHandler } from "../../handlers/reddit.js";
import { TwitterHandler } from "../../handlers/twitter.js";
import { Filter } from "bad-words";
import yaml from "yaml";
import fs from "fs";
import path from "path";

interface UnifiedSource {
  name: string;
  url: string;
  weight: number;
  type: "reddit" | "twitter";
}

function loadSources(): UnifiedSource[] {
  const configPath = path.join(process.cwd(), "sources.yaml");
  const config = yaml.parse(fs.readFileSync(configPath, "utf8"));

  const redditSources = (config.sources.reddit || []).map((src: any) => ({
    ...src,
    type: "reddit",
    weight: src.weight || 1,
  }));

  const twitterSources = (config.sources.twitter || []).map((src: any) => ({
    ...src,
    type: "twitter",
    weight: src.weight || 1,
  }));

  return [...redditSources, ...twitterSources];
}

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const item of items) {
    rand -= item.weight;
    if (rand <= 0) return item;
  }

  return items[items.length - 1];
}

export default {
  data: new SlashCommandBuilder()
    .setName("ralsei")
    .setDescription("Fetches a random Ralsei image"),

  async execute(interaction: CommandInteraction) {
    await interaction.deferReply();

    const sources = loadSources();
    const selected = weightedRandom(sources);
    const filter = new Filter();

    try {
      let result: any = null;
      let retries = 0;

      while (!result && retries < 3) {
        if (selected.type === "reddit") {
          result = await RedditHandler.getInstance().fetchImage();
        } else if (selected.type === "twitter") {
          result = await TwitterHandler.getInstance().fetchTweet();
        }

        // bad-words filter check, this will not count towards retries
        // if the result is profane, retry
        if (result && filter.isProfane(result.title || "")) {
          console.warn(
            `Filtered out profane content from ${selected.name}: ${result.title}`
          );
          result = null;
        }

        if (!result) retries++;
      }

      if (!result) {
        await interaction.editReply({
          content:
            "Sorry, I couldn't fetch a Ralsei post right now. Please try again later!",
        });
        return;
      }



      const embed = new EmbedBuilder()
        .setTitle(result.title || "Ralsei Post")
        .setColor(0x4caf50)
        .setURL(result.sourceUrl)
        .setFooter({
          text: `From: ${result.sourceName} • By: ${result.author}`,
        });

      if (result.mediaUrls?.length) {
        embed.setImage(result.mediaUrls[0]);
      } else if (result.url) {
        embed.setImage(result.url);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("Error in /ralsei command:", err);
      await interaction.editReply({
        content:
          "Oops! Something went wrong trying to fetch a Ralsei post. Try again later.",
      });
    }
  },
};
