import { SlashCommandBuilder } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ralsei-quote')
        .setDescription('Get a random Ralsei quote'),
    async execute(interaction: any) {
        await interaction.reply({
            content: 'placeholder',
        },
        );
    },
};