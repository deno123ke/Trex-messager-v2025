const axios = require("axios");

module.exports.config = {
  name: "pexels",
  version: "1.0",
  hasPermssion: 0,
  credits: "Hassan (modified by ChatGPT)",
  description: "Search high-quality images using Pexels API",
  commandCategory: "Image",
  usages: "pexels <query> [count]",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["px"]
};

module.exports.run = async function ({ api, event, args }) {
  const apiKey = 'NoL8ytYlwsYIqmkLBboshW909HzoBoBnGZJbpmwAcahp5PF9TAnr9p7Z';

  if (args.length === 0) {
    return api.sendMessage(
      `❌ Please provide an image search query.\nExample: -pexels 5 space galaxy\nOr: -pexels cat`,
      event.threadID,
      event.messageID
    );
  }

  let count = 6; // default
  let query;

  // Check if first arg is a number (for count)
  if (!isNaN(args[0])) {
    count = parseInt(args[0]);
    query = args.slice(1).join(" ");
  } else {
    query = args.join(" ");
  }

  if (!query || query.length < 2) {
    return api.sendMessage(
      `❌ Please provide a valid search query (at least 2 characters).\nExample: -pexels 6 mountains`,
      event.threadID,
      event.messageID
    );
  }

  try {
    api.setMessageReaction("🔍", event.messageID, () => {}, true);

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: apiKey }
    });

    if (!data.photos || data.photos.length === 0) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage(`😞 No results found for "${query}".`, event.threadID, event.messageID);
    }

    const attachments = await Promise.all(
      data.photos.map(photo =>
        axios.get(photo.src.original, { responseType: "stream" }).then(res => res.data)
      )
    );

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return api.sendMessage(
      {
        body: `🖼️ Pexels results for "${query}" (${attachments.length} images):`,
        attachment: attachments
      },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("PEXELS ERROR:", error.message || error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return api.sendMessage("❌ Failed to fetch images from Pexels. Please try again later.", event.threadID, event.messageID);
  }
};
