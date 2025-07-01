const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "cstory",
    aliases: ["horrorstory", "scary"],
    version: "2.4",
    author: "Hassan",
    description: "Generate a short horror story with a realistic image based on the title",
    commandCategory: "fun",
    usages: "story",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event }) {
    try {
      const apiKey = "AIzaSyB4f2iso5m9aSz84A57tmd-A597X-4nIMo"; // Replace with your actual Gemini API key

      // Step 1: Generate horror story using Gemini 2.0 Flash
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: "Write a short original horror story with a scary title. Do not use markdown or symbols like ##. Format: Title then new line then story. Maximum 4 paragraphs."
                }
              ]
            }
          ]
        },
        { headers: { "Content-Type": "application/json" } }
      );

      let storyRaw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!storyRaw) return api.sendMessage("❌ Failed to generate story.", event.threadID, event.messageID);

      // Step 2: Clean and split story into title + body
      const lines = storyRaw.replace(/^#+\s*/gm, "").trim().split("\n");
      const title = lines[0].trim();
      const content = lines.slice(1).join("\n").trim();

      if (!title || !content) {
        return api.sendMessage("❌ Could not extract valid title and story.", event.threadID, event.messageID);
      }

      // Step 3: Limit story body to max 4 paragraphs
      const paragraphs = content.split(/\n\s*\n/).slice(0, 4).join("\n\n").trim();

      // Step 4: Send horror story first
      await api.sendMessage(`🩸 𝗛𝗼𝗿𝗿𝗼𝗿 𝗦𝘁𝗼𝗿𝘆: ${title}\n\n${paragraphs}`, event.threadID);

      // Step 5: Generate realistic horror image
      const imageRes = await axios.get("https://www.ai4chat.co/api/image/generate", {
        params: {
          prompt: `${title}, realistic horror style, cinematic lighting, creepy atmosphere`,
          aspect_ratio: "2:3"
        }
      });

      const imageUrl = imageRes.data?.image_link;
      if (!imageUrl) return api.sendMessage("✅ Story sent, but failed to generate image.", event.threadID, event.messageID);

      // Step 6: Download and send image
      const imgPath = path.join(__dirname, "cache", `horror_${event.senderID}.jpg`);
      fs.mkdirSync(path.dirname(imgPath), { recursive: true });

      const imageStream = await axios.get(imageUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(imgPath);
      imageStream.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => {
          fs.unlinkSync(imgPath);
        }, event.messageID);
      });

      writer.on("error", err => {
        console.error("Image stream error:", err);
        api.sendMessage("✅ Story sent, but image failed to download.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error("STORY CMD ERROR:", err.message || err);
      api.sendMessage("🚨 An error occurred while generating the horror story.", event.threadID, event.messageID);
    }
  }
};
