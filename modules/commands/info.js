const fs = require("fs");
const gTTS = require("gtts");
const path = require("path");

module.exports = {
  config: {
    name: "info",
    version: "1.0",
    author: "Hassan",
    role: 0,
    shortDescription: "TTS about creator",
    longDescription: "The bot speaks about its creator Hassan using AI voice",
    category: "ai",
    guide: {
      en: "{pn} — bot will speak information about the creator"
    }
  },

  onStart: async function ({ api, event }) {
    const text = `My creator is Hassan. He is 19 years old, passionate about coding, and a skilled developer in Node.js. I was built using his intelligence, creativity, and love for innovation.`;

    const filePath = path.join(__dirname, "creatorvoice.mp3");
    const gtts = new gTTS(text, "en"); // default female English voice

    try {
      gtts.save(filePath, function (err) {
        if (err) {
          console.error("TTS Error:", err);
          return api.sendMessage("❌ Failed to generate voice.", event.threadID, event.messageID);
        }

        api.sendMessage(
          {
            body: "🎙️ Here's what I can say about my creator Hassan:",
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath)
        );
      });
    } catch (err) {
      console.error("TTS Error:", err);
      api.sendMessage("❌ An error occurred while generating the voice.", event.threadID, event.messageID);
    }
  }
};
