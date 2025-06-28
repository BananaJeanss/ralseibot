import { SlashCommandBuilder } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lead-never-follow-leaders')
        .setDescription('sosa'),
    async execute(interaction: { reply: (arg0: string) => any; }) {
        await interaction.reply('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2LrOmTx5qhnZsofFJSppO6-XMhBJW8No3Bw&s');
    }
};