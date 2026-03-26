import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import path from "node:path";
import fs from "node:fs";

// custom font registration
const fontPath = path.join(
  process.cwd(),
  "static",
  "textboxsprites",
  "determination-mono.ttf",
);
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, "DeterminationMono");
}

export default {
  data: new SlashCommandBuilder()
    .setName("textbox")
    .setDescription("Generate a textbox image")
    .addStringOption((option) =>
      option
        .setName("character")
        .setDescription("Choose a character for the textbox")
        .setRequired(true)
        .addChoices(
          { name: "Kris", value: "kris" },
          { name: "Susie", value: "susie" },
          { name: "Hat Ralsei", value: "hat-ralsei" },
          { name: "Hatless Ralsei", value: "hatless-ralsei" },
          { name: "Lancer", value: "lancer" },
          { name: "Queen", value: "queen" },
          { name: "Noelle", value: "noelle" },
          { name: "Tenna", value: "tenna" },
          { name: "Sans", value: "sans" },
          { name: "Spamton", value: "spamton" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to display in the textbox")
        .setRequired(true)
        .setMaxLength(300),
    )
    .addBooleanOption((option) =>
      option
        .setName("darkworld")
        .setDescription("Use the Dark World textbox border"),
    )
    .addBooleanOption((option) =>
      option.setName("spoiler").setDescription("Mark the image as a spoiler"),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    console.log(
      `Generating textbox for ${interaction.user.tag} in ${interaction.guild?.name}`,
    );

    try {
      const character = interaction.options.getString("character");
      const text = interaction.options.getString("text");

      if (!character || !text) {
        await interaction.editReply({
          content: "Missing required parameters.",
        });
        return;
      }

      const isDarkWorld = interaction.options.getBoolean("darkworld");
      const textboxImage = isDarkWorld
        ? await generateTextbox(character, text, true)
        : await generateTextbox(character, text, false);
      const spoilerImg = interaction.options.getBoolean("spoiler")
        ? "SPOILER_"
        : "";

      const attachment = new AttachmentBuilder(textboxImage, {
        name: `${spoilerImg}${character}_textbox.png`,
      });

      await interaction.editReply({
        files: [attachment],
      });
    } catch (error) {
      console.error("Error generating textbox:", error);
      await interaction.editReply({
        content:
          "Sorry, there was an error generating the textbox. Please try again later!",
      });
    }
  },
};

async function generateTextbox(
  character: string,
  text: string,
  darkWorld = false,
): Promise<Buffer> {
  // values
  const scale = 1.5;
  const width = 640 * scale;
  const height = 155 * scale;
  const spriteSize = 100 * scale;
  const spriteX = 20 * scale;
  const fontSize = 28 * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!darkWorld) {
    // background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    // White border if light world
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 8 * scale;
    ctx.strokeRect(2 * scale, 2 * scale, width - 4 * scale, height - 4 * scale);
  } else {
    // use darkworld.png as background if dark world
    try {
      const darkWorldPath = path.join(
        process.cwd(),
        "static",
        "textboxsprites",
        "darkworld.png",
      );
      if (fs.existsSync(darkWorldPath)) {
        const darkWorldImg = await loadImage(darkWorldPath);
        ctx.drawImage(darkWorldImg, 0, 0, width, height);
      } else {
        // fallback to black background if darkworld.png doesn't exist
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
    } catch (error) {
      console.log("Could not load darkworld background:", error);
      // fallback to black background if there's an error loading darkworld.png
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);
    }
  }

  const spriteY = (height - spriteSize) / 2;

  // Load and draw character sprite
  try {
    const spritePath = path.join(
      process.cwd(),
      "static",
      "textboxsprites",
      `${character}.png`,
    );
    if (fs.existsSync(spritePath)) {
      const sprite = await loadImage(spritePath);
      ctx.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize);
    } else {
      // Draw a placeholder if sprite doesn't exist
      drawPlaceholderSprite(ctx, character);
    }
  } catch (error) {
    console.log(`Could not load sprite for ${character}:`, error);
    // Draw a placeholder if sprite doesn't exist
    drawPlaceholderSprite(ctx, character);
  }

  // font settings
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${fontSize}px DeterminationMono, monospace`;

  // Word wrap and draw text
  const maxWidth = width - 140 * scale;
  const lineHeight = 25 * scale;
  const startX = 125 * scale;
  const startY = 50 * scale;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  // draw text
  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw each line of text
  lines.forEach((line, index) => {
    if (index < 4) {
      // Limit to 4 lines to fit in textbox
      ctx.fillText(line, startX, startY + index * lineHeight);
    }
  });

  return canvas.toBuffer("image/png");

  function drawPlaceholderSprite(ctx: any, character: string) {
    // Draw a colored placeholder rectangle
    const colors: { [key: string]: string } = {
      kris: "#4A90E2",
      susie: "#9013FE",
      ralsei: "#4CAF50",
    };

    const spriteY = (height - spriteSize) / 2;

    ctx.fillStyle = colors[character] || "#444444";
    ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    ctx.fillStyle = colors[character] || "#444444";
    ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);

    // placeholder text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px DeterminationMono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      character.toUpperCase(),
      spriteX + spriteSize / 2,
      spriteY + spriteSize / 2 + 6,
    );
    ctx.textAlign = "left";
  }
}
