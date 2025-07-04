import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { RedditHandler } from "../../handlers/reddit";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ralsei')
        .setDescription('Fetches a random Ralsei image'),
    async execute(interaction: any) {
        await interaction.deferReply();
        
        try {
            const redditHandler = RedditHandler.getInstance(); // Use singleton
            var imageResult = await redditHandler.fetchImage();
            
            let retryCount = 0;
            
            // Try to fetch the image up to 3 times if the first attempt fails
            while (!imageResult && retryCount < 3) {
                console.log(`Retrying to fetch Ralsei image... Attempt ${retryCount + 1}`);
                imageResult = await redditHandler.fetchImage();
                retryCount++;
            }
            
            // If still no result after retries, send error message
            if (!imageResult) {
                await interaction.editReply({
                    content: 'Sorry, I couldn\'t fetch a Ralsei image right now. Please try again later!',
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setTitle(imageResult.title || 'Ralsei Image')
                .setImage(imageResult.url)
                .setColor(0x4CAF50)
                .setURL(imageResult.sourceUrl);
            
            embed.setFooter({ text: `From: ${imageResult.sourceName} • By: ${imageResult.author}` });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error fetching Ralsei image:', error);
            await interaction.editReply({
                content: 'Sorry, there was an error fetching a Ralsei image. Please try again later!',
            });
        }
    },
};