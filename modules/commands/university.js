const axios = require("axios");

module.exports = {
  config: {
    name: "university",
    version: "1.0",
    hasPermssion: 0,
    credits: "Hassan",
    description: "Searches universities in a given country",
    commandCategory: "education",
    usages: "university [country name]",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args }) {
    const country = args.join(" ");
    if (!country) {
      return api.sendMessage("❌ Please provide a country name.\nExample: university United States", event.threadID, event.messageID);
    }

    const url = `http://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`;

    try {
      const res = await axios.get(url);
      const universities = res.data;

      if (!universities.length) {
        return api.sendMessage(`❌ No universities found for "${country}".`, event.threadID, event.messageID);
      }

      let msg = `🎓 Universities in ${country}:\n\n`;
      for (let i = 0; i < Math.min(10, universities.length); i++) {
        const uni = universities[i];
        msg += `${i + 1}. ${uni.name}\n🌐 Website: ${uni.web_pages[0]}\n\n`;
      }

      if (universities.length > 10) {
        msg += `...and ${universities.length - 10} more found.\nTry searching with a more specific country name.\n`;
      }

      return api.sendMessage(msg.trim(), event.threadID, event.messageID);

    } catch (err) {
      console.error("Error fetching university data:", err.message);
      return api.sendMessage("❌ Failed to fetch university data. Please try again later.", event.threadID, event.messageID);
    }
  }
};
