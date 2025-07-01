const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gen",
    version: "1.2",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate image with Flux AI" },
    longDescription: { en: "Sends prompt to Flux WebUI and returns the generated image." },
    category: "ai",
    guide: { en: "{pn} <your prompt>\nExample: ?fluxai a robot in the rain" }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ | Please enter a prompt.\nExample: ?fluxai a cat riding a rocket", event.threadID, event.messageID);
    }

    const loadingMessage = await new Promise((resolve) => {
      api.sendMessage("⏳ | Generating your image...", event.threadID, (err, info) => resolve(info));
    });

    try {
      const response = await axios.get(
        `https://betadash-api-swordslush-production.up.railway.app/fluxwebui?prompt=${encodeURIComponent(prompt)}`,
        { responseType: "stream" }
      );

      const filePath = path.join(__dirname, "fluxai_temp.jpg");
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await api.sendMessage({
          body: `✅ Imaage generated: ${prompt}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, event.messageID);

        fs.unlinkSync(filePath);
        if (loadingMessage?.messageID) {
          api.unsendMessage(loadingMessage.messageID);
        }
      });

      writer.on("error", (err) => {
        throw new Error("❌ Error writing file: " + err.message);
      });

    } catch (err) {
      console.error("fluxai error:", err);
      api.sendMessage(`❌ Failed to generate image: ${err.message}`, event.threadID, event.messageID);
      if (loadingMessage?.messageID) {
        api.unsendMessage(loadingMessage.messageID);
      }
    }
  }
};
