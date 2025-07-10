const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "f3",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate AI image using Flux Free" },
    longDescription: { en: "Sends thumbnails. Reply with U1, U2 to view  image." },
    category: "ai",
    guide: { en: "{pn} <prompt>" }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ Please provide a prompt.\nExample: f3 Cyberpunk samurai.", event.threadID, event.messageID);
    }

    const loadingMsg = await api.sendMessage("⏳ Processing your request...", event.threadID);

    try {
      // Request image generation
      const response = await axios.post("https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaaaaaaaaaaiimagegenerator/quick.php", {
        prompt,
        style_id: 27,
        size: "16-9"
      }, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "ai-text-to-image-generator-flux-free-api.p.rapidapi.com",
          "x-rapidapi-key": "84d37a31f2mshd9060a63e54857fp1c362bjsn090263123144"
        }
      });

      const images = response.data?.final_result;
      if (!images || images.length === 0) throw new Error("No images returned.");

      // Prepare two thumbnail attachments only
      const attachments = await Promise.all(
        images.slice(0, 2).map(async (img, index) => {
          const res = await axios.get(img.thumb, { responseType: "stream" });
          const tempPath = path.join(__dirname, `thumb_f3_${index + 1}.webp`);
          const writer = fs.createWriteStream(tempPath);
          res.data.pipe(writer);
          await new Promise(resolve => writer.on("finish", resolve));
          return fs.createReadStream(tempPath);
        })
      );

      const message = await api.sendMessage({
        body: `✅ Here are your generated images.\n💬 Reply with "U1" or "U2" to view the full version.`,
        attachment: attachments
      }, event.threadID, event.messageID);

      // Save handleReply
      global.api.handleReply.set(message.messageID, {
        name: this.config.name,
        author: event.senderID,
        threadID: event.threadID,
        images: images.slice(0, 2)
      });

      // Cleanup temp files
      attachments.forEach((_, i) => {
        const filePath = path.join(__dirname, `thumb_f3_${i + 1}.webp`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

      api.unsendMessage(loadingMsg.messageID);
    } catch (err) {
      api.unsendMessage(loadingMsg.messageID);
      api.sendMessage("❌ Failed: " + err.message, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const replyText = event.body.trim().toLowerCase();
    const index = parseInt(replyText.replace("u", "")) - 1;

    if (!["u1", "u2"].includes(replyText)) {
      return api.sendMessage("⚠️ Please reply with U1 or U2 to view image.", event.threadID, event.messageID);
    }

    const selected = Reply.images?.[index];
    if (!selected) {
      return api.sendMessage("❌ That image is not available.", event.threadID, event.messageID);
    }

    const res = await axios.get(selected.origin, { responseType: "stream" });
    const tempPath = path.join(__dirname, `full_f3_${index + 1}.webp`);
    const writer = fs.createWriteStream(tempPath);
    res.data.pipe(writer);

    writer.on("finish", async () => {
      await api.sendMessage({
        body: `🖼 Full image U${index + 1}:`,
        attachment: fs.createReadStream(tempPath)
      }, event.threadID, event.messageID);
      fs.unlinkSync(tempPath);
    });
  }
};
