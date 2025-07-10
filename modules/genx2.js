const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "genx2",
    aliases: ["Gx2"],
    version: "1.2",
    author: "Vex_Kshitiz + fixed by Lord Itachi",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Generate AI image"
    },
    longDescription: {
      en: "Generates an image using AI from a text prompt"
    },
    category: "ai",
    guide: {
      en: "{prefix}genx <your prompt>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage("❗ Please provide a prompt.\nExample: genx anime landscape", threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID, () => {}, true);
    const start = Date.now();

    try {
      const response = await axios.get(`https://dall-e-tau-steel.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}`);
      const imageUrl = response.data?.response;

      if (!imageUrl || !imageUrl.startsWith("http")) {
        throw new Error("Image URL not found in API response.");
      }

      const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);

      const imgPath = path.join(cacheDir, `genx_${Date.now()}.jpg`);
      await fs.writeFile(imgPath, imgResponse.data);

      const duration = ((Date.now() - start) / 1000).toFixed(2);
      await api.sendMessage({
        body: `Here's your image generated (${duration}s)`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => {
        fs.unlink(imgPath).catch(() => {});
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);

    } catch (error) {
      console.error("[GENX] Error:", error.message);
      api.sendMessage("❌ Failed to generate image. Try again later.", threadID, messageID);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
