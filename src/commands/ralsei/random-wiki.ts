import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export default {
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName('random-wiki')
        .setDescription('Gets a random wiki article from the Deltarune Wiki'),
    async execute(interaction: ChatInputCommandInteraction) {
        const wikiUrl = 'https://deltarune.fandom.com/wiki/Special:Random';
        
        try {
            const response = await fetch(wikiUrl, {
                redirect: 'follow'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const finalUrl = response.url;
            
            await interaction.reply({
                content: `Here's a random Deltarune Wiki article: ${finalUrl}`
            });
            
        } catch (error) {
            console.error('Error fetching random wiki article:', error);
            await interaction.reply({
                content: 'Sorry, I couldn\'t fetch a random wiki article right now.',
                ephemeral: true
            });
        }
    }
};