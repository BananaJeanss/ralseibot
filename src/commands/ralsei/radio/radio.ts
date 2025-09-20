import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} from "@discordjs/voice";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Joins a voice channel and plays music"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("🎵 Joining your voice channel...");

    const guild = interaction.guild; // not in guild
    if (!guild) {
      await interaction.editReply(
        "❌ This command can only be used in a server."
      );
      return;
    }

    const voiceState = guild.voiceStates.cache.get(interaction.user.id);
    const voiceChannel = voiceState?.channel;

    if (!voiceChannel) {
      // user not in vc
      await interaction.editReply(
        "❌ You need to be in a voice channel to listen to music, duh."
      );
      return;
    }

    const connGuildCheck = getVoiceConnection(guild.id); // check if already connected
    if (connGuildCheck) {
      await interaction.editReply(
        "❌ I'm already connected to a voice channel in this server."
      );
      return;
    }

    const connection = joinVoiceChannel({
      // join vc
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    // wait until the connection is ready
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch {
      await interaction.editReply("❌ Failed to join the voice channel.");
      connection.destroy();
      return;
    }

    // setup audio player
    const player = createAudioPlayer();
    connection.subscribe(player);

    // i cba to make a downloader script so it'll use static files
    let songNames;
    try {
        songNames = await fs.promises.readdir(path.join(__dirname, "songs"));
    } catch (e) {
        console.error("[radio] Failed to read songs directory:", e);
        await interaction.editReply("❌ No songs found to play.");
        connection.destroy();
        return;
    }
    let randTrack = songNames[Math.floor(Math.random() * songNames.length)];

    const playTrack = () => {
      // create a new resource for each play to avoid issues
      randTrack = songNames[Math.floor(Math.random() * songNames.length)];
      const pathToTrack = path.join(__dirname, "songs", randTrack);
      const resource = createAudioResource(pathToTrack);
      player.play(resource);
    };

    playTrack();
    await interaction.editReply(`▶️ Now playing from a collection of ${songNames.length} tracks\nCurrent track: **${randTrack}**`);

    // loop track or leave if nobody else in vc
    player.on(AudioPlayerStatus.Idle, () => {
      const stillHere = voiceChannel.members.size > 1;
      if (stillHere) {
        playTrack();
      } else {
        player.stop(true);
        connection.destroy();
      }
    });

    player.on("error", (e) => console.error("[radio] player error:", e));

    connection.on("error", (e) => {
      console.error("[radio] connection error:", e);
      player.stop(true);
      connection.destroy();
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      // destroy connection if disconnected
      player.stop(true);
      await interaction.followUp("🔇 Disconnected from the voice channel.");
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy();
      }
    });
  },
};
