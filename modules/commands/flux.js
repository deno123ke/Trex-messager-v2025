const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "flux",
    version: "1.0",
    author: "Hassan",
    description: "Generate and send an AI image using Flux API",
    category: "ai",
    usePrefix: true,
    cooldowns: 5
  },

  // Run when the bot starts
  onStart: async function () {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
      console.log("[FLUX] Created 'cache' directory onStart.");
    } else {
      console.log("[FLUX] 'cache' directory already exists.");
    }
    console.log("[FLUX] Command loaded and ready.");
  },

  // Run when the user calls the command
  run: async function ({ api, event, args }) {
    try {
      const prompt = args.join(" ") || "surreal futuristic flux concept art";
      console.log(`[FLUX] Prompt: ${prompt}`);

      const msg = await api.sendMessage(`🔄 Generating image for: "${prompt}"...`, event.threadID);

      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/flux?prompt=${encodeURIComponent(prompt)}`;
      console.log(`[FLUX] Requesting: ${apiUrl}`);

      const response = await axios.get(apiUrl);
      console.log("[FLUX] API response data:", response.data);

      const imageUrl = response.data?.data?.imageUrl;
      console.log(`[FLUX] Extracted image URL: ${imageUrl}`);

      if (!imageUrl) {
        console.error("[FLUX] imageUrl is missing or undefined.");
        return api.sendMessage("❌ Failed to fetch image URL from API.", event.threadID, event.messageID);
      }

      const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
      console.log("[FLUX] Image downloaded successfully.");

      const imgPath = path.join(__dirname, "cache", `flux_${event.senderID}.jpg`);
      fs.writeFileSync(imgPath, Buffer.from(imgRes.data, "binary"));
      console.log(`[FLUX] Image saved to: ${imgPath}`);

      api.sendMessage({
        body: `🌀 Flux image for: "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      }, event.threadID, () => {
        fs.unlinkSync(imgPath);
        console.log("[FLUX] Image file deleted after sending.");
      }, msg.messageID);

    } catch (error) {
      console.error("❌ [FLUX] Error occurred:", error.response?.data || error.message || error);
      api.sendMessage("❌ Something went wrong while generating the image.", event.threadID, event.messageID);
    }
  }
};
