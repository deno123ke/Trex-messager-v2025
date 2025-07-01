const axios = require("axios");
const ok = "xyz"; // Replace with the correct domain suffix

module.exports = {
  config: {
    name: "pm",
    version: "1.2",
    hasPermssion: 0,
    credits: "Team Calyx",
    description: "Get prompt suggestions for images or text using Gemini-style API",
    commandCategory: "ai",
    usages: "pm <prompt text | reply to image>",
    cooldowns: 5,
    usePrefix: true,
    aliases: ["p"]
  },

  run: async function ({ api, event, args }) {
    try {
      const promptText = args.join(" ");
      let imageUrl;
      let response;

      const replyAttachments = event.messageReply?.attachments;
      if (event.type === "message_reply" && replyAttachments?.[0]?.type === "photo") {
        imageUrl = replyAttachments[0].url;
      } else if (args[0]?.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/gi)) {
        imageUrl = args[0];
      } else if (!promptText && !imageUrl) {
        return api.sendMessage("❌ Reply to an image or provide a prompt text.", event.threadID, event.messageID);
      }

      if (["-r", "-random"].includes(promptText.toLowerCase())) {
        response = await axios.get(`https://smfahim.${ok}/prompt-random`);
        return api.sendMessage(response.data.data.prompt, event.threadID, event.messageID);
      }

      if (["-anime", "-a"].some(flag => promptText.toLowerCase().includes(flag))) {
        response = await axios.get(`https://smfahim.${ok}/prompt2?url=${encodeURIComponent(imageUrl || promptText)}`);
        if (response.data.code === 200) {
          return api.sendMessage(response.data.data, event.threadID, event.messageID);
        } else {
          return api.sendMessage("❌ Failed to retrieve anime prompt data.", event.threadID, event.messageID);
        }
      }

      if (imageUrl) {
        response = await axios.get(`https://smfahim.${ok}/prompt?url=${encodeURIComponent(imageUrl)}`);
        return api.sendMessage(response.data.result, event.threadID, event.messageID);
      } else {
        response = await axios.get(`https://smfahim.${ok}/prompt?text=${encodeURIComponent(promptText)}`);
        const description = response.data.prompt || response.data.result;
        return api.sendMessage(description, event.threadID, event.messageID);
      }

    } catch (error) {
      console.error("PM ERROR:", error.message || error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
