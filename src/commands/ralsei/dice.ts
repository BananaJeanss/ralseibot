import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll a 6-sided dice'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('🎲 Rolling the dice...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const roll = Math.floor(Math.random() * 6) + 1;
        
        const diceEmojis = {
            1: '<:jockington:1394470654459383928>',
            2: '<:kris:1394470643248136192>',
            3: '<:lancer:1394470631978045542>',
            4: '<:ralsei:1394470618614730852>',
            5: '<:susie:1394470605100679351>',
            6: '<:temmie:1394470589850456094>'
        };
        
        const emoji = diceEmojis[roll as keyof typeof diceEmojis];
        
        await interaction.editReply(`${emoji} You rolled a **${roll}**! `);
    },
};