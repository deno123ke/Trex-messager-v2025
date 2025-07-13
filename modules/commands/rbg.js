const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const FormData = require("form-data");
const sharp = require("sharp");

const PIXABAY_API_KEY = "46711335-97d2667e6a94493bcd7c2f920"; // your key

async function fetchPixabayImage(query, random = false) {
  const res = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true`);
  const data = await res.json();
  if (data.hits && data.hits.length > 0) {
    return random
      ? data.hits[Math.floor(Math.random() * data.hits.length)].largeImageURL
      : data.hits[0].largeImageURL;
  } else {
    throw new Error("No Pixabay images found.");
  }
}

module.exports = {
  config: {
    name: "rbg",
    version: "4.0",
    author: "Hassan",
    description: "Remove image background and replace it with transparent, solid color, Pixabay image, or random",
    commandCategory: "tools",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args }) {
    const reply = event.messageReply;
    if (!reply || !reply.attachments || reply.attachments[0].type !== "photo") {
      return api.sendMessage("📸 Please reply to a photo to remove its background.", event.threadID, event.messageID);
    }

    const imageUrl = reply.attachments[0].url;
    const tempPath = path.join(__dirname, "cache", `${event.senderID}_temp.png`);
    const finalPath = path.join(__dirname, "cache", `${event.senderID}_result.png`);

    const inputArg = args.join(" ")?.trim().toLowerCase() || "transparent";

    try {
      // Step 1: Remove background
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_url", imageUrl);

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": "z33nVXkF1i89RUYFFqTCo2yJ" },
        body: formData
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`remove.bg error: ${response.status} - ${errText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(tempPath, buffer);
      const foreground = sharp(tempPath);
      const { width, height } = await foreground.metadata();

      let finalImage;

      if (inputArg === "transparent") {
        finalImage = foreground.png();

      } else if (inputArg === "random") {
        const bgURL = await fetchPixabayImage("background", true);
        const bgResp = await fetch(bgURL);
        const bgBuffer = Buffer.from(await bgResp.arrayBuffer());

        finalImage = sharp(bgBuffer)
          .resize(width, height)
          .composite([{ input: await foreground.png().toBuffer(), blend: "over" }])
          .png();

      } else if (inputArg.startsWith("change=")) {
        const query = inputArg.slice(7).trim();
        const bgURL = await fetchPixabayImage(query);
        const bgResp = await fetch(bgURL);
        const bgBuffer = Buffer.from(await bgResp.arrayBuffer());

        finalImage = sharp(bgBuffer)
          .resize(width, height)
          .composite([{ input: await foreground.png().toBuffer(), blend: "over" }])
          .png();

      } else if (inputArg.startsWith("url=")) {
        const bgURL = inputArg.slice(4).trim();
        const bgResp = await fetch(bgURL);
        const bgBuffer = Buffer.from(await bgResp.arrayBuffer());

        finalImage = sharp(bgBuffer)
          .resize(width, height)
          .composite([{ input: await foreground.png().toBuffer(), blend: "over" }])
          .png();

      } else {
        // Treat as solid color
        finalImage = sharp({
          create: {
            width,
            height,
            channels: 3,
            background: inputArg
          }
        })
        .composite([{ input: await foreground.png().toBuffer(), blend: "over" }])
        .png();
      }

      await finalImage.toFile(finalPath);

      return api.sendMessage({
        body: `✅ Background changed to: ${inputArg}`,
        attachment: fs.createReadStream(finalPath)
      }, event.threadID, () => {
        fs.unlinkSync(tempPath);
        fs.unlinkSync(finalPath);
      }, event.messageID);

    } catch (err) {
      console.error("removebg error:", err);
      return api.sendMessage("❌ Failed to process image. Try again later.", event.threadID, event.messageID);
    }
  }
};
