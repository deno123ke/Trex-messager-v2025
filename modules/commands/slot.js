const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slot",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Play slot machine",
    longDescription: "Bet coins to win or lose in a slot machine game",
    category: "economy",
    guide: "{pn} <betAmount>"
  },

  onStart: async function ({ message, event, args }) {
    try {
      const userID = event.senderID;
      const bet = parseInt(args[0]);
      const dbPath = path.join(__dirname, "..", "data", "users.json");

      if (isNaN(bet) || bet <= 0) {
        return message.reply("❌ Please enter a valid amount to bet.");
      }

      if (!fs.existsSync(dbPath)) return message.reply("❌ No data found. Use 'daily' first.");

      const db = await fs.readJson(dbPath);
      const userData = db[userID];

      if (!userData || userData.coins < bet) {
        return message.reply("❌ You don't have enough coins to bet.");
      }

      const symbols = ["🍒", "🍋", "🍉", "🔔", "⭐", "🍇"];
      const roll = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      let result = roll.join(" | ");
      let win = false;
      let winnings = 0;

      if (roll[0] === roll[1] && roll[1] === roll[2]) {
        win = true;
        winnings = bet * 5;
        userData.coins += winnings;
      } else {
        userData.coins -= bet;
      }

      db[userID] = userData;
      await fs.writeJson(dbPath, db, { spaces: 2 });

      return message.reply(
        `🎰 ${result} 🎰\n\n` +
        (win
          ? `🎉 You won ${winnings} coins!`
          : `💸 You lost ${bet} coins. Better luck next time!`)
      );
    } catch (err) {
      console.error("slot.js error:", err);
      return message.reply("❌ An error occurred while running the 'slot' command.");
    }
  }
};
