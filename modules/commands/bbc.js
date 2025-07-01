const axios = require("axios");

module.exports.config = {
  name: "bbc",
  version: "1.3",
  hasPermssion: 0,
  credits: "Hassan",
  description: "Fetch BBC headlines or UK news by category",
  commandCategory: "News",
  usages: "bbc [category]",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["bbcnews"]
};

module.exports.run = async function({ api, event, args }) {
  const apiKey = "de15d27819af4e1f9f1dff41ad9f8c7a";
  const threadID = event.threadID;
  const messageID = event.messageID;
  const cat = args[0]?.toLowerCase();

  const allowedCats = ["business", "entertainment", "general", "health", "science", "sports", "technology"];

  console.log(`[BBC CMD] Args received: ${args.join(" ") || "none"}`);

  // If no valid category, fetch from BBC only
  if (!cat || !allowedCats.includes(cat)) {
    console.log("[BBC CMD] No valid category, fetching top BBC headlines...");

    try {
      const { data } = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          sources: "bbc-news",
          apiKey,
          pageSize: 5
        }
      });

      console.log(`[BBC CMD] Response received: ${data.articles?.length || 0} articles`);

      if (!data.articles || data.articles.length === 0) {
        return api.sendMessage("❌ No BBC headlines found.", threadID, messageID);
      }

      const text = data.articles.map((a, i) =>
        `${i + 1}. ${a.title}\n🔗 ${a.url}`
      ).join("\n\n");

      return api.sendMessage(`🗞️ BBC News (Top 5):\n\n${text}`, threadID, messageID);
    } catch (err) {
      console.error("[BBC CMD] Error fetching BBC top headlines:", err.message);
      return api.sendMessage("🚨 Failed to fetch BBC News. Try again later.", threadID, messageID);
    }
  }

  // Else: fetch by category (UK)
  console.log(`[BBC CMD] Valid category "${cat}" detected. Fetching UK news by category...`);

  try {
    const { data } = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "gb",
        category: cat,
        apiKey,
        pageSize: 5
      }
    });

    console.log(`[BBC CMD] Response received for category "${cat}": ${data.articles?.length || 0} articles`);

    if (!data.articles || data.articles.length === 0) {
      return api.sendMessage(`❌ No UK ${cat} news found.`, threadID, messageID);
    }

    const text = data.articles.map((a, i) =>
      `${i + 1}. ${a.title}\n🔗 ${a.url}`
    ).join("\n\n");

    return api.sendMessage(`🗞️ UK News (${cat.charAt(0).toUpperCase() + cat.slice(1)}):\n\n${text}`, threadID, messageID);
  } catch (err) {
    console.error(`[BBC CMD] Error fetching category "${cat}" news:`, err.message);
    return api.sendMessage("🚨 Failed to fetch BBC News. Try again later.", threadID, messageID);
  }
};
