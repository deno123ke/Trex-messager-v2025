const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  config: {
    name: "imagen",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate images using StarryAI",
    longDescription: "Generate 2 AI images using the StarryAI API with the Lyra model.",
    category: "image",
    guide: "{pn} [prompt]\nExample: {pn} futuristic astronaut on mars"
  },

  onStart: async function ({ event, message, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please provide a prompt.\nExample: imagen cute girl with glowing hair");
    }

    const apiKey = "4imdA9MaoJxE9kGjLZNMr_UTu8x9Cg";

    try {
      const response = await fetch("https://api.starryai.com/creations/", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          model: "lyra",
          prompt,
          aspectRatio: "square",
          highResolution: false,
          images: 2,
          steps: 20,
          initialImageMode: "color"
        })
      });

      const data = await response.json();

      if (!response.ok || !data || !data.images || data.images.length === 0) {
        return message.reply(`❌ API Error: ${data?.message || "No images returned."}`);
      }

      const attachments = [];

      for (let i = 0; i < data.images.length; i++) {
        const imageUrl = data.images[i];
        const imgRes = await fetch(imageUrl);
        const buffer = await imgRes.buffer();
        const filename = path.join(__dirname, `imagen_${uuidv4()}.jpg`);
        fs.writeFileSync(filename, buffer);
        attachments.push(fs.createReadStream(filename));
      }

      message.reply({
        body: `✨ Here are 2 images for: "${prompt}"`,
        attachment: attachments
      }, () => {
        // Clean up
        attachments.forEach(file => fs.unlinkSync(file.path));
      });

    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to generate image. Try again later.");
    }
  }
};
