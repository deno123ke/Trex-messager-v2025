const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    author: "Tawsif~",
    category: "image",
    countDown: 5,
    role: 0,
    guide: {
      en: "edit <prompt> | reply to an image"
    }
  },

  onStart: async function ({ message, event, args }) {
    try {
      const prompt = args.join(" ");
      const reply = event.messageReply;

      if (!reply || !reply.attachments || reply.attachments[0].type !== "photo") {
        return message.reply("❌ Please reply to an image.");
      }

      if (!prompt) {
        return message.reply("⚠️ You must provide a prompt.\nExample: edit make it anime style");
      }

      const imageUrl = reply.attachments[0].url;
      await message.reply("⏳ Please wait while I edit your image...");

      const apiUrl = `https://tawsifz-gemini.onrender.com/edit?texts=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const tempPath = path.join(__dirname, `edited-${Date.now()}.png`);

      fs.writeFileSync(tempPath, Buffer.from(response.data));

      await message.reply({
        body: `✅ Edited image with prompt: "${prompt}"`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error("EDIT CMD ERROR:", err);
      message.reply(`❌ Error: ${err.message}`);
    }
  }
};
