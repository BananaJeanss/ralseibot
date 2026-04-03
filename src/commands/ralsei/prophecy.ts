import GIFEncoder from "gif-encoder-2";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import path from "node:path";

// prophecy font from: https://www.reddit.com/r/Deltarune/comments/1mi7osp/i_dunno_what_i_did_to_my_drive_but_here_are_the/?share_id=lNAlPjrAgHMp8-HAKsMPH&utm_medium=android_app&utm_name=androidcss&utm_source=share&utm_term=1
// depth-blue.png from: https://github.com/HippoWaterMelon/deltaprophecy/blob/main/assets/depth/depth-blue.png

// this is ass but whatever
export default {
  data: new SlashCommandBuilder()
    .setName("prophecy")
    .setDescription("[IN DEV] Generate a prophecy tile")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text of the prophecy")
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("The prophecy image")
        .setRequired(false),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // ack
    await interaction.deferReply();

    const text = interaction.options.getString("text", true);
    const image = interaction.options.getAttachment("image", false);

    const width = 500;
    const height = 500;

    // font stuff
    GlobalFonts.registerFromPath(
      process.cwd() + "./static/prophecy.ttf",
      "Prophecy",
    );

    // draw image
    // all copies are monochrome - toby fox
    const imageLoad = image
      ? await loadImage(image.url)
      : path.join(process.cwd(), "static", "monochrome.png");
    const img = await loadImage(imageLoad);

    // monochrome the image just in case
    const monochromeCanvas = createCanvas(img.width, img.height);
    const monochromeCtx = monochromeCanvas.getContext("2d");
    monochromeCtx.drawImage(img, 0, 0);
    const monochromeData = monochromeCtx.getImageData(
      0,
      0,
      img.width,
      img.height,
    );
    for (let i = 0; i < monochromeData.data.length; i += 4) {
      const r = monochromeData.data[i];
      const g = monochromeData.data[i + 1];
      const b = monochromeData.data[i + 2];
      const avg = (r + g + b) / 3;
      monochromeData.data[i] = avg;
      monochromeData.data[i + 1] = avg;
      monochromeData.data[i + 2] = avg;
    }
    monochromeCtx.putImageData(monochromeData, 0, 0);

    // keep only white pixels of the image
    const subjectCanvas = createCanvas(img.width, img.height);
    const subjectCtx = subjectCanvas.getContext("2d");
    subjectCtx.drawImage(monochromeCanvas, 0, 0);
    const subjectData = subjectCtx.getImageData(0, 0, img.width, img.height);
    for (let i = 0; i < subjectData.data.length; i += 4) {
      const r = subjectData.data[i];
      const g = subjectData.data[i + 1];
      const b = subjectData.data[i + 2];
      const a = subjectData.data[i + 3];
      if (r === 255 && g === 255 && b === 255 && a > 0) {
        subjectData.data[i] = 255;
        subjectData.data[i + 1] = 255;
        subjectData.data[i + 2] = 255;
        subjectData.data[i + 3] = 255;
      } else {
        subjectData.data[i + 3] = 0;
      }
    }
    subjectCtx.putImageData(subjectData, 0, 0);

    // tile depth-blue.png into a large canvas so there's room to pan
    const IMAGE_DEPTHS = await loadImage(
      path.join(process.cwd(), "static", "depth-blue.png"),
    );
    const tilesX = 8;
    const tilesY = 8;
    const tiledW = IMAGE_DEPTHS.width * tilesX;
    const tiledH = IMAGE_DEPTHS.height * tilesY;
    const depthsCanvas = createCanvas(tiledW, tiledH);
    const depthsCtx = depthsCanvas.getContext("2d");
    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        depthsCtx.drawImage(IMAGE_DEPTHS, tx * IMAGE_DEPTHS.width, ty * IMAGE_DEPTHS.height);
      }
    }

    // zoom the image and choose random position
    const zoom = 0.5;
    const overlaySpeed = 5; // source-px to scroll per frame
    // positive = content scrolls left/up, negative = content scrolls right/down
    const panDirX = 1;  // towards left
    const panDirY = 1;  // towards top
    const totalFrames = 48; // 42/2 = 2 seconds at 24
    const travel = totalFrames * overlaySpeed;
    // offset baseX/baseY so the crop window stays in bounds regardless of direction
    const baseX = travel * Math.max(0, -panDirX) + Math.random() * (tiledW - width  / zoom - travel * Math.abs(panDirX));
    const baseY = travel * Math.max(0, -panDirY) + Math.random() * (tiledH - height / zoom - travel * Math.abs(panDirY));

    const bobSpeed = 1;
    const bobAmplitude = 15; // px up/down
    const imageWidth = 250;
    const imageHeight = 250;
    const lines = text.split(/\\n|\n/);
    const lineHeight = 50;

    const encoder = new GIFEncoder(width, height);
    encoder.setDelay(50); // 100ms = 10fps
    encoder.setRepeat(0); // loop forever
    encoder.start();
    encoder.setTransparent(0x000000); // set black as transparent color

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const iconCanvas = createCanvas(width, height);
    const iconCtx = iconCanvas.getContext("2d");

    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / totalFrames;
      const yOffset = Math.sin(t * 2 * Math.PI * bobSpeed) * bobAmplitude;

      // scroll overlay in one direction
      const panX = baseX + frame * overlaySpeed * panDirX;
      const panY = baseY + frame * overlaySpeed * panDirY;

      // clear canvases
      ctx.clearRect(0, 0, width, height);
      iconCtx.clearRect(0, 0, width, height);

      // draw subject image with sine offset
      iconCtx.drawImage(
        subjectCanvas,
        width / 2 - imageWidth / 2,
        height / 2 - imageHeight / 2 + 25 + yOffset,
        imageWidth,
        imageHeight,
      );

      // draw text with sine offset
      iconCtx.font = `64px "Prophecy"`;
      iconCtx.textAlign = "center";
      iconCtx.fillStyle = "white";
      lines.forEach((line, i) => {
        iconCtx.fillText(
          line.trim(),
          width / 2,
          height / 2 - imageHeight / 2 - 50 + i * lineHeight + yOffset,
        );
      });

      // source-in: clip icon+text to depths texture
      iconCtx.globalCompositeOperation = "source-in";
      iconCtx.drawImage(
        depthsCanvas,
        panX,
        panY,
        width / zoom,
        height / zoom,
        0,
        0,
        width,
        height,
      );
      iconCtx.globalCompositeOperation = "source-over";

      // draw icon
      ctx.drawImage(iconCanvas, 0, 0);

      encoder.addFrame(ctx as any);
    }

    encoder.finish();
    const buffer = Buffer.from(encoder.out.getData());

    // send image
    await interaction.editReply({
      files: [{ attachment: buffer, name: "prophecy.gif" }],
    });
  },
};
