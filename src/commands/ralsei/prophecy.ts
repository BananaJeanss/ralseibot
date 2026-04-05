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
        .setDescription("The prophecy image (Must be monochrome)")
        .setRequired(true),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    // ack
    await interaction.deferReply();

    const text = interaction.options.getString("text", true);
    const image = interaction.options.getAttachment("image", true);

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
    // positive = content scrolls left/up, negative = content scrolls right/down
    const panDirX = 1;  // towards left
    const panDirY = 1;  // towards top
    const totalFrames = 120; // 24 fps * n seconds
    // travel exactly one tile per loop so the tiled texture stitches seamlessly
    const overlaySpeed = IMAGE_DEPTHS.width / totalFrames;
    const travel = IMAGE_DEPTHS.width; // = totalFrames * overlaySpeed
    // offset baseX/baseY so the crop window stays in bounds regardless of direction
    const baseX = travel * Math.max(0, -panDirX) + Math.random() * (tiledW - width  / zoom - travel * Math.abs(panDirX));
    const baseY = travel * Math.max(0, -panDirY) + Math.random() * (tiledH - height / zoom - travel * Math.abs(panDirY));

    const bobSpeed = 2;    // integer cycles per loop
    const bobAmplitude = 15; // px up/down
    const ghostSpeed = 2;  // must also be integer for smooth loop
    const ghostAmplitude = 10; // px diagonal offset per ghost level
    const imageWidth = 250;
    const imageHeight = 250;
    const lines = text.split(/\\n|\n/);
    const lineHeight = 50;

    // gif cook time
    const encoder = new GIFEncoder(width, height);
    encoder.setDelay(50); // 100ms = 10fps
    encoder.setRepeat(0); // loop forever
    encoder.start();
    encoder.setTransparent(0x000000); // set black as transparent color

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    const iconCanvas = createCanvas(width, height);
    const iconCtx = iconCanvas.getContext("2d");
    const ghostCanvas = createCanvas(width, height);
    const ghostCtx = ghostCanvas.getContext("2d");

    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / totalFrames;
      const yOffset = Math.sin(t * 2 * Math.PI * bobSpeed) * bobAmplitude;

      // scroll overlay in one direction
      const panX = baseX + frame * overlaySpeed * panDirX;
      const panY = baseY + frame * overlaySpeed * panDirY;

      // clear canvases
      ctx.clearRect(0, 0, width, height);
      iconCtx.clearRect(0, 0, width, height);
      ghostCtx.clearRect(0, 0, width, height);

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

      // ghost the icon part boom
      // how much offset from center (goes top left then center then bottom right)
      const offset1 = Math.sin(t * 2 * Math.PI * ghostSpeed) * ghostAmplitude;

      // ghost 2 — double offset, least opaque
      ghostCtx.globalAlpha = 0.2;
      ghostCtx.drawImage(
        subjectCanvas,
        width / 2 - imageWidth / 2 + offset1 * 2,
        height / 2 - imageHeight / 2 + 25 + yOffset + offset1 * 2,
        imageWidth,
        imageHeight,
      );

      // ghost 1 — single offset
      ghostCtx.globalAlpha = 0.4;
      ghostCtx.drawImage(
        subjectCanvas,
        width / 2 - imageWidth / 2 + offset1,
        height / 2 - imageHeight / 2 + 25 + yOffset + offset1,
        imageWidth,
        imageHeight,
      );

      ghostCtx.globalAlpha = 1.0;

      // source-in: clip ghost to depths texture
      ghostCtx.globalCompositeOperation = "source-in";
      ghostCtx.drawImage(
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
      ghostCtx.globalCompositeOperation = "source-over";

      // draw ghost 
      ctx.drawImage(ghostCanvas, 0, 0);

      // draw icon on top
      ctx.drawImage(iconCanvas, 0, 0);

      // GIF has no partial transparency so this just makes the semi-transparent pixels darker
      const frameData = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < frameData.data.length; i += 4) {
        const a = frameData.data[i + 3];
        if (a > 0 && a < 255) {
          frameData.data[i]     = Math.round(frameData.data[i]     * a / 255);
          frameData.data[i + 1] = Math.round(frameData.data[i + 1] * a / 255);
          frameData.data[i + 2] = Math.round(frameData.data[i + 2] * a / 255);
          frameData.data[i + 3] = 255;
        }
      }
      ctx.putImageData(frameData, 0, 0);

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
