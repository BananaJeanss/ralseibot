import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import {
  fetchWiki,
  formatNameToWikiUrl,
  searchWiki,
} from "../../../lib/fetchWiki";

export default {
  data: new SlashCommandBuilder()
    .setName("deltawiki")
    .setDescription("Fetch an article from deltarune.wiki")
    .addStringOption((option) =>
      option
        .setName("article")
        .setDescription("Search for an article")
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // ack
    await interaction.deferReply();

    // get article
    const article = interaction.options.getString("article", true);
    // search
    const searchResult = await searchWiki(article, "deltarune");
    if (!searchResult) {
      await interaction.editReply(`❌ No results found for "${article}"`);
      return;
    }
    // format
    const formattedRes = formatNameToWikiUrl(searchResult, "deltarune");
    // fetch
    const wikiData = await fetchWiki(formattedRes, "deltarune");

    const embed = new EmbedBuilder()
      .setTitle(wikiData.title)
      .setDescription(wikiData.description)
      .setFooter({ text: `Data fetched from deltarune.wiki` })
      .setColor(0x000000)
      .setURL(wikiData.ogLink);
    if (wikiData.image) {
      embed.setThumbnail(wikiData.image);
    }

    // for each extrafield, add a field
    if (wikiData.extrafields) {
      for (const [key, value] of Object.entries(wikiData.extrafields)) {
        if (value) {
          embed.addFields({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: Array.isArray(value) ? value.join(", ") : value,
            inline: true,
          });
        }
      }
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
