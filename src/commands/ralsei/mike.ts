import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

const verbs = [
  'rebuild', 'destroy', 'construct', 'demolish', 'fix', 'break', 'create', 
  'dismantle', 'repair', 'wreck', 'assemble', 'shatter', 'build', 'renovate',
  'restore', 'obliterate', 'craft', 'ruin', 'forge', 'smash', 'yeet', 'bonk',
  'squish', 'tickle', 'lick', 'throw', 'juggle', 'steal', 'worship', 'consume',
  'befriend', 'intimidate', 'seduce', 'bamboozle', 'floss', 'dab', 'vibe-check',
  'boop', 'pet', 'adopt', 'summon', 'banish', 'fold', 'scramble', 'marinade',
  'microwave', 'deep-fry', 'season', 'marinate', 'grill', 'roast', 'toast',
  'hug', 'slap', 'poke', 'sniff', 'taste', 'bite', 'chomp', 'munch'
];

const determiners = [
  'the', 'my', 'our', 'your', 'their', 'this', 'that', 'these', 'those',
  'some', 'all', 'every', 'each', 'both', 'either', 'neither', 'any'
];

const nouns = [
  'set', 'kids', 'stage', 'show', 'studio', 'cameras', 'lights', 'props',
  'scene', 'backdrop', 'equipment', 'microphones', 'screens', 'speakers',
  'cables', 'production', 'broadcast', 'audience', 'ratings', 'script',
  'toaster', 'spaghetti', 'rubber ducky', 'lawn mower', 'cheese grater',
  'banana', 'shoe collection', 'pet rock', 'homework', 'dignity', 'sanity',
  'left sock', 'wifi password', 'sleep schedule', 'social life', 'motivation',
  'brain cells', 'happiness', 'will to live', 'pizza rolls', 'energy drinks',
  'plushies', 'gaming chair', 'houseplants', 'tax returns', 'password manager',
  'spotify playlist', 'discord server', 'meme folder', 'crush', 'therapist',
  'coffee addiction', 'procrastination habits', 'anxiety', 'existential dread',
  'childhood trauma', 'credit score', 'metabolism', 'back pain', 'goblin mode',
  'feral raccoons', 'emotional support chicken', 'forbidden snacks', 'chaos energy'
];

export default {
    cooldown: 2,
    data: new SlashCommandBuilder()
        .setName('mike')
        .setDescription('Mike, rebuild the set!! Rebuild my kids!!'),
    async execute(interaction: ChatInputCommandInteraction) {
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
        const randomDeterminer = determiners[Math.floor(Math.random() * determiners.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        
        const output = `Mike, ${randomVerb} ${randomDeterminer} ${randomNoun}!`;
        
        await interaction.reply(output);
    },
};