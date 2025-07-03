import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "node:path";
import fs from "node:fs";

// custom font registration
const fontPath = path.join(__dirname, "sprites", "determination-mono.ttf");
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: "DeterminationMono" });
}

module.exports = {
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
          { name: "Ralsei", value: "ralsei" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to display in the textbox")
        .setRequired(true)
        .setMaxLength(300)
    ),
  async execute(interaction: any) {
    await interaction.deferReply();
    console.log(
      `Generating textbox for ${interaction.user.tag} in ${interaction.guild.name}`
    );

    try {
      const character = interaction.options.getString("character");
      const text = interaction.options.getString("text");

      const textboxImage = await generateTextbox(character, text);

      const attachment = new AttachmentBuilder(textboxImage, {
        name: `${character}_textbox.png`,
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
  text: string
): Promise<Buffer> {
  // values
  const width = 640;
  const height = 155;
  const spriteSize = 100;
  const spriteX = 20;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // White border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 8;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  const spriteY = (height - spriteSize) / 2;

  // Load and draw character sprite
  try {
    const spritePath = path.join(__dirname, "sprites", `${character}.png`);
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
  ctx.font = "28px DeterminationMono, monospace";

  // Word wrap and draw text
  const maxWidth = width - 140;
  const lineHeight = 25;
  const startX = 125;
  const startY = 50;

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

    const spriteY = (155 - spriteSize) / 2;

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
      spriteY + spriteSize / 2 + 6
    );
    ctx.textAlign = "left";
  }
}
