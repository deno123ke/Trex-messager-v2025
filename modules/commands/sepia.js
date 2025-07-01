const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");

module.exports = {
  config: {
    name: "sepia",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Apply sepia filter to a replied image",
    category: "image",
    guide: "{pn} (reply to an image)"
  },

  onStart: async function ({ event, message }) {
    try {
      const attachment = event.messageReply?.attachments?.[0];
      if (!attachment || attachment.type !== "photo") {
        return message.reply("❌ Please reply to a photo to apply the sepia filter.");
      }

      const imageUrl = attachment.url;
      const inputPath = path.join(__dirname, "input.jpg");
      const outputPath = path.join(__dirname, "output.jpg");

      // Download the image
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(inputPath, res.data);

      // Apply sepia filter using sharp
      await sharp(inputPath)
        .modulate({ saturation: 0.3 })
        .tint("#704214")
        .toFile(outputPath);

      await message.reply({
        body: "🟤 Sepia filter applied!",
        attachment: fs.createReadStream(outputPath)
      });

      // Cleanup
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    } catch (err) {
      console.error("❌ Error applying sepia filter:", err);
      message.reply(`❌ Failed to apply sepia filter.\nError: ${err.message}`);
    }
  }
};
