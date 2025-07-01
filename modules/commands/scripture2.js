const axios = require("axios");

module.exports.config = {
  name: "scripture2",
  version: "3.0",
  hasPermssion: 0,
  credits: "Hassan",
  description: "Get a Bible verse (random or specific). Supports Tagalog & English.",
  commandCategory: "Bible",
  usages: "[query] | [-tl or -en for language]",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["bible", "verse"]
};

module.exports.run = async function ({ api, event, args }) {
  let lang = "en";
  let query = args.join(" ");

  // Check for language option
  if (args[0] === "-tl" || args[0] === "--tl") {
    lang = "tl";
    args.shift();
    query = args.join(" ");
  } else if (args[0] === "-en" || args[0] === "--en") {
    lang = "en";
    args.shift();
    query = args.join(" ");
  }

  // Use default random verse if no query
  if (!query) {
    const randomVerses = [
      "John 3:16",
      "Romans 8:28",
      "Psalm 23",
      "Philippians 4:13",
      "Genesis 1:1",
      "Matthew 5:9",
      "Proverbs 3:5",
      "Isaiah 41:10"
    ];
    query = randomVerses[Math.floor(Math.random() * randomVerses.length)];
  }

  const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${lang === "tl" ? "tagalog" : "kjv"}`;

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (data.error) {
      return api.sendMessage(`❌ Error: ${data.error}`, event.threadID, event.messageID);
    }

    const verses = data.verses.map(v =>
      `${v.book_name} ${v.chapter}:${v.verse} — "${v.text.trim()}"`
    ).join("\n\n");

    let message = `📖 ${data.reference} (${lang.toUpperCase()})\n\n${verses}`;

    // Facebook message limit
    if (message.length > 1900) {
      message = message.substring(0, 1800) + "\n\n⛔ Too long, showing partial content.";
    }

    api.sendMessage(message, event.threadID, event.messageID);
  } catch (err) {
    console.error("SCRIPTURE CMD ERROR:", err.message || err);
    api.sendMessage("🚨 Error fetching scripture. Please try again later.", event.threadID, event.messageID);
  }
};
