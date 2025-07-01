const axios = require('axios');

module.exports = {
  config: {
    name: "animeimg",
    aliases: ["neko", "waifu", "foxgirl"],
    version: "2.0.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Get anime images by category",
    category: "entertainment",
    guide: {
      en: "{pn} [category]\n\nAvailable: neko, waifu, foxgirl, shinobu, maid, megumin, etc.\nUse no category to get a random one."
    }
  },

  onStart: async function ({ api, event, args }) {
    const supported = [
      "neko", "waifu", "foxgirl", "shinobu", "maid", "megumin", "catgirl", "uniform", "nom", "handhold"
    ];
    
    let category = args[0]?.toLowerCase();

    if (!supported.includes(category)) {
      category = supported[Math.floor(Math.random() * supported.length)];
    }

    const url = `https://nekos.best/api/v2/${category}`;

    try {
      const res = await axios.get(url);
      const result = res.data.results[0];
      const imageUrl = result.url;

      const stream = (await axios.get(imageUrl, { responseType: 'stream' })).data;

      return api.sendMessage({
        body: `🎌 Random ${category} anime image`,
        attachment: stream
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error("Failed to fetch image:", err.message);
      return api.sendMessage("❌ Could not fetch an anime image. Try again later.", event.threadID, event.messageID);
    }
  }
};
