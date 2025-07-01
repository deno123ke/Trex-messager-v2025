const axios = require('axios');

module.exports = {
  config: {
    name: "anim",
    aliases: ["waiu", "nek"],
    version: "2.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Send a random anime image",
    category: "entertainment",
    guide: {
      en: "{pn} [category]\nAvailable: waifu, neko, hug, kiss, cry, smile, handhold, etc."
    }
  },

  onStart: async function ({ api, event, args }) {
    const categories = [
      "waifu", "neko", "shinobu", "megumin",
      "bully", "cuddle", "cry", "hug",
      "awoo", "smile", "wave", "highfive",
      "handhold", "blush", "nom", "wink",
      "poke", "dance", "yeet"
    ];

    let category = args[0]?.toLowerCase();

    if (!categories.includes(category)) {
      category = categories[Math.floor(Math.random() * categories.length)];
    }

    try {
      const res = await axios.get(`https://api.waifu.pics/sfw/${category}`);
      const imgStream = (await axios.get(res.data.url, { responseType: 'stream' })).data;

      api.sendMessage({
        body: `🎌 Anime (${category})`,
        attachment: imgStream
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err.message);
      api.sendMessage("❌ Could not fetch an anime image. Try again later.", event.threadID, event.messageID);
    }
  }
};
