import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Events,
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
import { RadioUsers } from "../../../metrics";

let perServerHistory: { [guildId: string]: string[] } = {};
let perServerNowPlaying: { [guildId: string]: string } = {};

let songNames: string[] = [];

// if TsRadio url provided, use that, otherwise its just static files
const TsRadioUrl = Bun.env.TS_RADIO_URL;

interface TsRadioMetadata {
  title: string;
  artist: string;
  album: string;
  length: number; // in seconds
  genre: string;
}

class TsRadioHandler {
  constructor() {
    // nothing to construct brochacho
  }

  async getCurrentInfo() {
    const data = (await fetch(TsRadioUrl + "/metadata").then((res) =>
      res.json(),
    )) as TsRadioMetadata;
    return data;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Joins a voice channel and plays music")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("nowplaying")
        .setDescription("Shows the current track"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("stop").setDescription("Stops the music and leaves"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("play")
        .setDescription("Starts playing music in your voice channel"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("history")
        .setDescription("Shows the radio history for this server"),
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

      let sourceText = TsRadioUrl
        ? "Radio Stream"
        : `Collection of ${songNames.length} songs`;
      let nowPlayingText = `🎵 Now playing: **${nowplaying}**\n-# ${sourceText}`;

      await interaction.reply(nowPlayingText);
    } else if (interaction.options.getSubcommand() === "stop") {
      const connGuildCheck = getVoiceConnection(guild.id); // check if connected
      if (!connGuildCheck) {
        await interaction.reply("❌ I'm not connected to a voice channel.");
        return;
      }

      // leave vc
      connGuildCheck.destroy();
      RadioUsers.dec();
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
          "❌ You need to be in a voice channel to listen to music, duh.",
        );
        return;
      }

      const connGuildCheck = getVoiceConnection(guild.id); // check if already connected
      if (connGuildCheck) {
        await interaction.editReply(
          "❌ I'm already connected to a voice channel in this server.",
        );
        return;
      }

      console.log(
        `[radio] Attempting to join voice channel: ${voiceChannel.name} in guild: ${guild.name}`,
      );

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
      let randTrack = "";
      if (!TsRadioUrl) {
        try {
          songNames = await fs.promises.readdir(
            path.resolve(process.cwd(), "static", "songs"),
          );
          songNames = songNames.filter(
            (file) =>
              file.endsWith(".mp3") ||
              file.endsWith(".wav") ||
              file.endsWith(".ogg"),
          );
        } catch (e) {
          console.error("[radio] Failed to read songs directory:", e);
          await interaction.editReply("❌ No songs found to play.");
          connection.destroy();
          return;
        }
        randTrack = songNames[Math.floor(Math.random() * songNames.length)];
      }

      let disconnectHandled = false;
      // disconnect handler
      async function disconnectedFromVc() {
        if (disconnectHandled) return; // already handled by voiceStateUpdate
        disconnectHandled = true;
        // destroy connection if disconnected aka kicked
        player.stop(true);
        await interaction.followUp("🔇 Disconnected from the voice channel.");
        if (Bun.env.TS_RADIO_URL) {
          clearInterval(metadataPoll);
        }
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
          RadioUsers.dec();
          interaction.client.off(Events.VoiceStateUpdate, voiceStateHandler);
        }
      }

      // register VoiceStateUpdate listener
      const voiceStateHandler = async () => {
        const membersInChannel = voiceChannel.members.filter(
          (member) => !member.user.bot,
        );
        if (membersInChannel.size === 0) {
          await disconnectedFromVc();
        }
      };

      interaction.client.on(Events.VoiceStateUpdate, voiceStateHandler);

      const playTrack = async () => {
        if (TsRadioUrl) {
          const tsRadio = new TsRadioHandler();
          const resource = createAudioResource(TsRadioUrl + "/stream");
          player.play(resource);
          // set now playing
          perServerNowPlaying[guild.id] = await tsRadio
            .getCurrentInfo()
            .then((info) => `${info.artist} - ${info.title}`);
          if (!perServerHistory[guild.id]) {
            perServerHistory[guild.id] = [];
          }

          // add to history & clear out old entries
          perServerHistory[guild.id].push(perServerNowPlaying[guild.id]);
          if (perServerHistory[guild.id].length >= 11) {
            perServerHistory[guild.id].shift();
          }
          return;
        }

        // else play from static files
        // create a new resource for each play to avoid issues
        randTrack = songNames[Math.floor(Math.random() * songNames.length)];
        const pathToTrack = path.resolve(
          process.cwd(),
          "static",
          "songs",
          randTrack,
        );
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

      await playTrack();

      // since TsRadio is a continuous stream, we'll have to poll for metadata updates
      const metadataPoll = setInterval(async () => {
        const tsRadio = new TsRadioHandler();
        const currentInfo = await tsRadio.getCurrentInfo();
        const currentTrack = `${currentInfo.artist} - ${currentInfo.title}`;
        // if track changed, update now playing and history
        if (currentTrack !== perServerNowPlaying[guild.id]) {
          perServerNowPlaying[guild.id] = currentTrack;
          // add to history & clear out old entries
          if (!perServerHistory[guild.id]) {
            perServerHistory[guild.id] = [];
          }
          perServerHistory[guild.id].push(currentTrack);
          if (perServerHistory[guild.id].length >= 11) {
            perServerHistory[guild.id].shift();
          }
          console.log(`[radio] Now playing: ${currentTrack}`);
        }
      }, 60_000); // poll every 60 seconds

      console.log(`[radio] Now playing: ${perServerNowPlaying[guild.id]}`);

      // everything succeeded
      let sourceText = TsRadioUrl
        ? "Radio Stream"
        : `Collection of ${songNames.length} songs`;
      await interaction.editReply(
        `▶️ Now playing from ${sourceText}\nCurrent track: **${perServerNowPlaying[guild.id]}**`,
      );
      RadioUsers.inc();

      let isDisconnected = false;

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          console.log("[radio] Moved voice channel");
          // channel move, ignore
        } catch {
          // disconnected, cleanup
          console.log("[radio] Disconnected from voice channel");
          isDisconnected = true;
          await disconnectedFromVc();
        }
      });

      // loop track or leave if nobody else in vc
      // with TsRadioUrl this would never happen as its a continuous ffmpeg stream
      player.on(AudioPlayerStatus.Idle, async () => {
        if (isDisconnected) return;
        if (TsRadioUrl) {
          console.warn(
            "This shouldn't have happened, TsRadioUrl is set but player went idle",
          );
          return;
        }

        await playTrack(); // play next random track

        // add to history
        if (!perServerHistory[guild.id]) {
          perServerHistory[guild.id] = [];
        }
        perServerHistory[guild.id].push(randTrack);
      });

      player.on("error", (e: any) => console.error("[radio] player error:", e));

      connection.on("error", (e: any) => {
        console.error("[radio] connection error:", e);
        player.stop(true);
        RadioUsers.dec();
        connection.destroy();
      });
    }
  },
};
