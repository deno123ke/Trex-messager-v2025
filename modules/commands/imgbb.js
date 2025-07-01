const axios = require("axios");

module.exports = {
  config: {
    name: "imgbb",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hassan",
    description: "Upload an image to ImgBB and get a public link",
    commandCategory: "utility",
    usages: "imgbb <reply to image>",
    cooldowns: 5,
    usePrefix: true,
    aliases: ["uploadimg", "imgup"]
  },

  run: async function ({ api, event }) {
    const attachments = event.messageReply?.attachments;

    if (!attachments || attachments.length === 0 || attachments[0].type !== "photo") {
      return api.sendMessage("❌ Please reply to an image to upload it to ImgBB.", event.threadID, event.messageID);
    }

    const imageUrl = attachments[0].url;
    const apiUrl = `https://imgbbsh.vercel.app/imgbb?image=${encodeURIComponent(imageUrl)}`;

    try {
      const res = await axios.get(apiUrl);
      const result = res.data;

      if (result.success && result.data?.display_url) {
        return api.sendMessage(
          `✅ Image uploaded successfully!\n🔗 ${result.data.display_url}`,
          event.threadID,
          event.messageID
        );
      } else {
        return api.sendMessage("❌ Failed to upload the image to ImgBB.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("IMGBB ERROR:", error.message || error);
      return api.sendMessage(`❌ Error uploading image: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
