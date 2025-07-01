const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "daily",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Claim your daily reward",
    longDescription: "Allows users to claim daily coins and exp once every 24 hours",
    category: "economy",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    try {
      const userID = event.senderID;
      const dbPath = path.join(__dirname, "..", "data", "users.json");

      // Make sure DB file exists
      if (!fs.existsSync(dbPath)) await fs.outputJson(dbPath, {});

      const db = await fs.readJson(dbPath);

      const now = new Date().toDateString();
      const userData = db[userID] || { coins: 0, exp: 0, lastDaily: null };

      if (userData.lastDaily === now) {
        return message.reply("❌ You have already claimed your daily reward today.");
      }

      const rewardCoins = 100;
      const rewardExp = 10;

      userData.coins += rewardCoins;
      userData.exp += rewardExp;
      userData.lastDaily = now;

      db[userID] = userData;
      await fs.writeJson(dbPath, db, { spaces: 2 });

      return message.reply(`✅ You received ${rewardCoins} coins and ${rewardExp} exp!`);
    } catch (err) {
      console.error("daily.js error:", err);
      return message.reply("❌ An error occurred while running the 'daily' command.");
    }
  }
};
