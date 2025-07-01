const axios = require('axios');

module.exports = {
  config: {
    name: "unsplash",
    version: "2.3",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Search Unsplash images",
    longDescription: "Get high-quality Unsplash images based on a keyword.",
    category: "media",
    guide: {
      en: "{pn} <search term>"
    }
  },

  onStart: async function ({ message, args }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("❌ Please enter a search term.\nExample: ?unsplash nature");
    }

    try {
      const res = await axios.get(`https://unsplashjs.vercel.app/unsplash?query=${encodeURIComponent(query)}`);
      const results = res.data;

      if (!results.length) {
        return message.reply(`❌ No results found for "${query}".`);
      }

      const attachments = [];

      for (let i = 0; i < Math.min(5, results.length); i++) {
        const img = results[i];
        try {
          const imageRes = await axios.get(img.imageUrl, {
            responseType: 'stream',
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Referer': 'https://unsplash.com/'
            }
          });
          attachments.push(imageRes.data);
        } catch (err) {
          console.warn(`⚠️ Could not fetch image ${i + 1}: ${err.message}`);
        }
      }

      if (attachments.length === 0) {
        return message.reply("❌ Couldn't load any images. Try again later.");
      }

      return message.reply({ body: "✅ Here is your results", attachment: attachments });

    } catch (err) {
      console.error("❌ Unsplash fetch error:", err.message);
      return message.reply("❌ Failed to fetch image results from Unsplash.");
    }
  }
};
