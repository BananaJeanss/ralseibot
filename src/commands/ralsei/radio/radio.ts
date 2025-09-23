import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
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
import fs from "node:fs";

let perServerHistory: { [guildId: string]: string[] } = {};
let perServerNowPlaying: { [guildId: string]: string } = {};

let songNames: string[] = [];

export default {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Joins a voice channel and plays music")
    .addSubcommand((subcommand) =>
      subcommand.setName("nowplaying").setDescription("Shows the current track")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("stop").setDescription("Stops the music and leaves")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setDescription("Starts playing music in your voice channel")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("history")
        .setDescription("Shows the radio history for this server")
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild; // not in guild check

    if (!guild) {
      await interaction.reply("❌ This command can only be used in a server.");
      return;
    }

    if (interaction.options.getSubcommand() === "nowplaying") {
      const connGuildCheck = getVoiceConnection(guild.id); // check if connected
      if (!connGuildCheck) {
        await interaction.reply("❌ I'm not connected to a voice channel.");
        return;
      }

      const nowplaying =
        perServerNowPlaying[guild.id] || "No track is playing.";

      await interaction.reply(
        `🎵 Now playing: **${nowplaying}**\n-# Collection of ${songNames.length} songs`
      );
    } else if (interaction.options.getSubcommand() === "stop") {
      const connGuildCheck = getVoiceConnection(guild.id); // check if connected
      if (!connGuildCheck) {
        await interaction.reply("❌ I'm not connected to a voice channel.");
        return;
      }

      connGuildCheck.destroy();
      await interaction.reply("⏹️ Stopped playing and left the voice channel.");
    } else if (interaction.options.getSubcommand() === "history") {
      const history = perServerHistory[guild.id];

      if (!history || history.length === 0) {
        await interaction.reply("📜 No history available for this server.");
        return;
      }

      const historyList = history
        .slice(-10) // show last 10 tracks
        .map((track, index) => `${index + 1}. ${track}`)
        .join("\n");

      const histEmbed = new EmbedBuilder()
        .setTitle("📜 Radio History")
        .setDescription(historyList)
        .setColor("#6e6d00");

      await interaction.reply({ embeds: [histEmbed] });
    } else if (interaction.options.getSubcommand() === "play") {
      await interaction.reply("🎵 Joining your voice channel...");

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
      try {
        songNames = await fs.promises.readdir(path.resolve(process.cwd(), "static", "songs"));
        songNames = songNames.filter((file) => file.endsWith(".mp3") || file.endsWith(".wav") || file.endsWith(".ogg"));
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
        const pathToTrack = path.resolve(process.cwd(), "static", "songs", randTrack);
        const resource = createAudioResource(pathToTrack);
        player.play(resource);

        // set now playing
        perServerNowPlaying[guild.id] = randTrack;
        if (!perServerHistory[guild.id]) {
          perServerHistory[guild.id] = [];
        }

        // add to history & clear out old entries
        perServerHistory[guild.id].push(randTrack);
        if (perServerHistory[guild.id].length >= 11) {
          perServerHistory[guild.id].shift();
        }
      };

      playTrack();
      await interaction.editReply(
        `▶️ Now playing from a collection of ${songNames.length} tracks\nCurrent track: **${randTrack}**`
      );

      // loop track or leave if nobody else in vc
      player.on(AudioPlayerStatus.Idle, () => {
        const stillHere = voiceChannel.members.size > 1;
        if (stillHere) {
          playTrack(); // play next random track

          // add to history
          if (!perServerHistory[guild.id]) {
            perServerHistory[guild.id] = [];
          }
          perServerHistory[guild.id].push(randTrack);
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
    }
  },
};
