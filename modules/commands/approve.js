const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "approve",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Approve user or thread"
    },
    longDescription: {
      en: "Approve specific user or thread for special access"
    },
    category: "admin",
    guide: {
      en: "{pn} [userID|threadID]"
    }
  },

  onStart: async function ({ api, event, args, message, threadsData }) {
    try {
      const { threadID, messageID } = event;
      
      if (!args[0]) {
        return message.reply("⚠️ Please provide a userID or threadID to approve.");
      }

      const targetID = args[0];
      
      try {
        const userInfo = await api.getUserInfo(targetID);
        if (!userInfo[targetID]) {
          return message.reply("❌ User not found. Please check the ID.");
        }
      } catch (e) {
        try {
          const threadInfo = await api.getThreadInfo(targetID);
          if (!threadInfo) {
            return message.reply("❌ Neither user nor thread found with this ID.");
          }
        } catch (e) {
          return message.reply("❌ Invalid ID provided.");
        }
      }

      const dataPath = path.join(__dirname, "..", "data", "approved.json");
      let approved = {};
      
      try {
        approved = await fs.readJson(dataPath);
      } catch (e) {
        await fs.writeJson(dataPath, { users: [], threads: [] });
        approved = { users: [], threads: [] };
      }

      // FIXED: Added missing parenthesis here
      if (approved.users.includes(targetID)) {
        return message.reply("✅ This user is already approved.");
      }
      
      if (approved.threads.includes(targetID)) {
        return message.reply("✅ This thread is already approved.");
      }

      if (targetID.length === 10 || targetID.length === 11) {
        approved.users.push(targetID);
      } else {
        approved.threads.push(targetID);
      }

      await fs.writeJson(dataPath, approved);
      return message.reply(`✅ Successfully approved ${targetID.length === 10 || targetID.length === 11 ? "user" : "thread"} ${targetID}`);
      
    } catch (error) {
      console.error("Error in approve command:", error);
      message.reply("❌ An error occurred while processing your request.");
    }
  }
};
