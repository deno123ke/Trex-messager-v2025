const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "setavt",
    aliases: ["changeavt", "setavatar"],
    version: "1.5",
    author: "Hassan",
    countDown: 5,
    hasPermssion: 1, // Admins only
    description: {
      en: "Change bot avatar"
    },
    category: "owner",
    guide: {
      en: "{pn} [image url | reply to image] [caption] [expiration in seconds]"
    }
  },

  langs: {
    en: {
      setavt: { // This is your category
        cannotGetImage: "❌ Failed to fetch image from the provided URL",
        invalidImageFormat: "❌ Invalid image format. Please provide a valid image (jpg, png, etc.)",
        changedAvatar: "✅ Successfully changed bot's profile picture",
        noImageFound: "❌ No image found. Please:\n- Provide an image URL\n- Reply to an image message\n- Attach an image with this command",
        apiError: "❌ Facebook API error: %1",
        syntaxError: "⚠️ Invalid syntax. Usage:\n{pn} [image url | reply to image] [caption] [expiration in seconds]"
      }
    }
  },

  onStart: async function ({ message, event, api, args, getLang }) {
    try {
      let imageURL;
      
      // Check for URL in arguments
      if (args[0]?.startsWith("http")) {
        imageURL = args[0];
      } 
      // Check for attached image
      else if (event.attachments?.[0]?.type === "photo") {
        imageURL = event.attachments[0].url;
      } 
      // Check for replied message with image
      else if (event.messageReply?.attachments?.[0]?.type === "photo") {
        imageURL = event.messageReply.attachments[0].url;
      }

      if (!imageURL) {
        // CORRECTED LINE: Added "setavt" category
        return message.reply(getLang("setavt", "noImageFound"));
      }

      // Parse expiration time if provided
      let expirationAfter = null;
      // Adjusted logic for caption and expiration
      let caption = '';
      let potentialExpiration = args[args.length - 1];

      if (args.length > 1 && !isNaN(potentialExpiration)) {
          expirationAfter = parseInt(potentialExpiration) * 1000; // Convert to milliseconds
          caption = args.slice(1, args.length - 1).join(" "); // Caption is everything between URL and last arg
      } else {
          caption = args.slice(1).join(" "); // Caption is everything after URL
      }


      // Download the image
      const response = await axios.get(imageURL, {
        responseType: "arraybuffer",
        timeout: 10000 // 10 seconds timeout
      });

      if (!response.headers["content-type"]?.startsWith("image/")) {
        // CORRECTED LINE: Added "setavt" category
        return message.reply(getLang("setavt", "invalidImageFormat"));
      }

      // Save to temporary file
      const tempPath = `${__dirname}/temp_avatar_${Date.now()}.jpg`;
      await fs.writeFile(tempPath, response.data);

      // Change avatar
      await api.changeAvatar(fs.createReadStream(tempPath), caption, expirationAfter);

      // Clean up
      await fs.unlink(tempPath);

      // CORRECTED LINE: Added "setavt" category
      return message.reply(getLang("setavt", "changedAvatar"));
    } catch (err) {
      console.error("Setavt error:", err);
      if (err.message.includes("EAUTH")) {
        return message.reply("❌ Failed to authenticate. The bot may not have permission to change its profile picture.");
      } else if (err.code === "ECONNABORTED") {
        return message.reply("❌ Connection timeout while fetching the image. Please try again.");
      }
      // CORRECTED LINE: Added "setavt" category
      return message.reply(getLang("setavt", "apiError", err.message));
    }
  }
};
