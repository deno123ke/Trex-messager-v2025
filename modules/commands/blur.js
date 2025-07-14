const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const canvas = require("canvas");
const faceapi = require("@vladmandic/face-api");

module.exports = {
  config: {
    name: "blur",
    version: "2.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Blur full image or detected faces only",
    category: "image",
    guide: "{pn} full | face (reply to an image)"
  },

  onStart: async function ({ event, message, args }) {
    const mode = args[0]?.toLowerCase() || "full";
    const attachment = event.messageReply?.attachments?.[0];

    if (!attachment || attachment.type !== "photo") {
      return message.reply("❌ Please reply to a photo to blur.");
    }

    const imageUrl = attachment.url;
    const cacheDir = path.join(__dirname, "cache");
    fs.mkdirSync(cacheDir, { recursive: true });

    const inputPath = path.join(cacheDir, `${event.senderID}_input.jpg`);
    const outputPath = path.join(cacheDir, `${event.senderID}_blurred.jpg`);

    try {
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(inputPath, res.data);

      if (mode === "full") {
        await sharp(inputPath).blur(10).toFile(outputPath);
      } else if (mode === "face") {
        // Load image into canvas
        const img = await canvas.loadImage(inputPath);
        const cnv = canvas.createCanvas(img.width, img.height);
        const ctx = cnv.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Load face-api models
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
        const detections = await faceapi.detectAllFaces(cnv);

        if (detections.length === 0) {
          return message.reply("😕 No faces detected to blur.");
        }

        // Apply blur to face regions
        const baseImage = sharp(inputPath);
        const blurredImage = await sharp(inputPath).blur(20).toBuffer();

        const composites = detections.map(det => {
          const { x, y, width, height } = det.box;
          return {
            input: blurredImage,
            left: Math.floor(x),
            top: Math.floor(y),
            raw: {
              width: Math.floor(width),
              height: Math.floor(height),
              channels: 3
            }
          };
        });

        await baseImage.composite(composites).toFile(outputPath);
      } else {
        return message.reply("❌ Invalid mode. Use `blur full` or `blur face`.");
      }

      await message.reply({
        body: `✅ Image blurred (${mode})!`,
        attachment: fs.createReadStream(outputPath)
      });

      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (err) {
      console.error("❌ Blur error:", err);
      message.reply(`❌ Failed to blur image.\n${err.message}`);
    }
  }
};
