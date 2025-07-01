const axios = require("axios");

module.exports = {
  config: {
    name: "news",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Get the latest news",
    longDescription: "Shows top 5 news and lets you reply with number to read more",
    category: "media",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    const API_KEY = "5add1b164341e9a647e32d33f4620ef0"; // Replace with your actual GNews API key
    const URL = `https://gnews.io/api/v4/top-headlines?lang=en&country=us&max=5&apikey=${API_KEY}`;

    try {
      const res = await axios.get(URL);
      const articles = res.data.articles;

      if (!articles || articles.length === 0)
        return message.reply("❌ No news found.");

      const newsList = articles
        .map((a, i) => `${i + 1}. ${a.title} (${a.source.name})`)
        .join("\n");

      const fullMessage = `📰 Top 5 News Headlines:\n\n${newsList}\n\nReply with a number (1-5) to view full details.`;

      message.reply(fullMessage, async (err, info) => {
        if (!err) {
          global.api.handleReply.set(info.messageID, {
            name: "news",
            author: event.senderID,
            threadID: event.threadID, // Required for handleReply to work properly
            articles
          });
        }
      });
    } catch (err) {
      console.error("NEWS ERROR:", err.message);
      message.reply("❌ Failed to fetch news. Try again later.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    if (event.senderID !== Reply.author)
      return message.reply("⚠️ Only the original requester can use this.");

    const index = parseInt(event.body.trim()) - 1;

    if (isNaN(index) || index < 0 || index >= Reply.articles.length)
      return message.reply("⚠️ Please reply with a number between 1 and 5.");

    const article = Reply.articles[index];

    const details = `📰 ${article.title}\n\n🗞 Source: ${article.source.name}\n🕒 Published: ${article.publishedAt}\n\n📄 ${article.description || "No description"}\n\n🔗 Read more: ${article.url}`;

    message.reply(details);
  }
};
