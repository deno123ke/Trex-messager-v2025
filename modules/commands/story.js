const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "story",
    aliases: ["shortstory", "randomstory"],
    version: "1.0",
    author: "Hassan",
    description: "Get a random story with an image",
    commandCategory: "fun",
    usages: "story",
    cooldowns: 5,
    usePrefix: true
  },

  onStart: async function ({ api, event }) {
    try {
      // Fetch random story
      const storyRes = await axios.get("https://shortstories-api.onrender.com");
      const story = storyRes.data;

      const title = story.title || "Random Story";
      const content = story.story || "No story found.";

      // Send story text first
      await api.sendMessage(`📖 𝗧𝗶𝘁𝗹𝗲: ${title}\n\n${content}`, event.threadID);

      // Generate image (AI art based on title)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(title + " story scene")}`;
      const imgPath = path.join(__dirname, "cache", `story_${event.senderID}.jpg`);

      fs.mkdirSync(path.dirname(imgPath), { recursive: true });

      const imgRes = await axios.get(imageUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(imgPath);

      imgRes.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: "🖼️ Here's an image inspired by the story!",
          attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => {
          fs.unlinkSync(imgPath);
        });
      });

      writer.on("error", (err) => {
        console.error("Image download error:", err);
        api.sendMessage("❌ Failed to download image.", event.threadID);
      });

    } catch (err) {
      console.error("ERROR in story command:", err.message);
      api.sendMessage("❌ Failed to fetch story or image.", event.threadID, event.messageID);
    }
  }
};
