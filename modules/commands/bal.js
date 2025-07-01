const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bal",
    aliases: ["balance"],
    version: "1.0",
    author: "Hassan",
    countDown: 3,
    role: 0,
    shortDescription: "Check your balance",
    longDescription: "Displays your current coin and experience balance",
    category: "economy",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    try {
      const userID = event.senderID;
      const dbPath = path.join(__dirname, "..", "data", "users.json");

      if (!fs.existsSync(dbPath)) return message.reply("❌ No balance data found yet.");

      const db = await fs.readJson(dbPath);
      const userData = db[userID];

      if (!userData) return message.reply("❌ You don't have a balance yet. Use daily first.");

      return message.reply(
        `💰 Coins: ${userData.coins || 0}\n🧪 Exp: ${userData.exp || 0}`
      );
    } catch (err) {
      console.error("bal.js error:", err);
      return message.reply("❌ Failed to get balance. Please try again later.");
    }
  }
};
