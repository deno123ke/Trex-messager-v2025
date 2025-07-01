const axios = require("axios");

module.exports.config = {
  name: "magic",
  version: "3.4",
  hasPermssion: 0,
  credits: "TawsiN",
  description: "Generate an AI image from text using Fahim's Magic API",
  commandCategory: "AI-Image",
  usages: "magic <prompt>",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["magicstudio", "aiart", "magicgen"]
};

module.exports.run = async function ({ api, event, args }) {
  let prompt = args.join(" ").trim();

  if (!prompt && event.type === "message_reply") {
    prompt = event.messageReply.body?.trim() || '';
  }

  if (!prompt) {
    return api.sendMessage("😈 Please provide a prompt or reply to a message!", event.threadID, event.messageID);
  }

  const imageUrl = `https://smfahim.xyz/magicstudio?prompt=${encodeURIComponent(prompt)}`;

  try {
    const res = await axios.get(imageUrl, { responseType: "stream" });

    const msg = {
      body: `✨ Here's your magic creation for: "${prompt}"`,
      attachment: res.data
    };

    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (err) {
    console.error("Magic image generation error:", err.message);
    return api.sendMessage("❌ Failed to generate magic image. Please try again later.", event.threadID, event.messageID);
  }
};
