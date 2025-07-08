import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ralsei-quote')
        .setDescription('Get a random Ralsei quote'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply({
            content: 'placeholder',
        },
        );
    },
};