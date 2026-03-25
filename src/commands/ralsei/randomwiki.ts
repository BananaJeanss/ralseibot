import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { fetchWiki, formatNameToWikiUrl, randomWikiUrl, searchWiki } from "../../lib/fetchWiki";

export default {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("randomwiki")
    .setDescription("Gets a random wiki article from the Deltarune Wiki"),
  async execute(interaction: ChatInputCommandInteraction) {
    // ack
    await interaction.deferReply();

    // flippy coiny
    const wikiChoice = Math.random() < 0.5 ? "deltarune" : "undertale";

    // get article
    const article = await randomWikiUrl(wikiChoice);

    // search
    const searchResult = await searchWiki(article, wikiChoice);
    if (!searchResult) {
      await interaction.editReply(`❌ No results found for "${article}"`);
      return;
    }
    // format
    const formattedRes = formatNameToWikiUrl(searchResult, wikiChoice);
    // fetch
    const wikiData = await fetchWiki(formattedRes, wikiChoice);

    const embed = new EmbedBuilder()
      .setTitle(wikiData.title)
      .setDescription(wikiData.description)
      .setFooter({ text: `Data fetched from ${wikiChoice}.wiki` })
      .setColor((wikiChoice === "deltarune" ? 0x000000 : 0xb962b9))
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
