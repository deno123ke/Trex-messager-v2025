const axios = require('axios');

module.exports = {
  config: {
    name: "pix",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Search images from Pixabay",
    longDescription: "Get high-quality images from Pixabay with details. You can also specify how many images to receive.",
    category: "media",
    guide: {
      en: "{pn} <search term> [count]\nExample: {pn} cat 5"
    }
  },

  onStart: async function ({ api, message, args }) {
    if (!args.length) {
      return message.reply("❌ Please enter a search term.\nExample: ?pixabay cat 5");
    }

    let count = 5;
    const lastArg = args[args.length - 1];
    if (!isNaN(lastArg)) {
      count = Math.min(10, Math.max(1, parseInt(lastArg))); // limit 1-10
      args.pop(); // remove count from args
    }

    const query = args.join(" ");

    try {
      const res = await axios.get(`https://pixyjs-hassan.vercel.app/pixabay?query=${encodeURIComponent(query)}&count=${count}`);
      const results = res.data;

      if (!Array.isArray(results) || !results.length) {
        return message.reply(`❌ No results found for "${query}".`);
      }

      const attachments = [];
      let caption = `✅ Here is your result:\n`;

      for (let i = 0; i < Math.min(count, results.length); i++) {
        try {
          const stream = await global.utils.getStreamFromURL(results[i].imageUrl);
          attachments.push(stream);
        } catch (err) {
          console.warn(`⚠️ Could not fetch image ${i + 1}:`, err.message);
        }
      }

      return message.reply({ body: caption, attachment: attachments });

    } catch (err) {
      console.error("❌ Pixabay fetch error:", err.message);
      return message.reply("❌ Failed to fetch image results from Pixabay.");
    }
  }
};
