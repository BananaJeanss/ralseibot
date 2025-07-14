import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
} from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, loadImage } from "canvas";

export default {
  data: new SlashCommandBuilder()
    .setName("ralseify-image")
    .setDescription("Ralseify either your pfp, or provided image URL")
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription(
          "The image URL to Ralseify (leave empty for your profile picture)"
        )
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const ralseifyImg = path.join(__dirname, "ralsei.png");
      const imageUrl =
        interaction.options.getString("image") ||
        interaction.user.displayAvatarURL({ extension: "png", size: 512 });

      const baseImage = await loadImage(imageUrl);
      const overlayImage = await loadImage(ralseifyImg);
      const canvas = createCanvas(overlayImage.width, overlayImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(overlayImage, 0, 0);

      const buffer = canvas.toBuffer("image/png");

      const attachment = new AttachmentBuilder(buffer, {
        name: "ralseify.png",
      });
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error("Error ralseifying image:", error);
      await interaction.editReply(
        "Sorry, I couldn't ralseify that image. Please make sure the URL is valid, or try again later."
      );
    }
  },
};
