const axios = require("axios");

module.exports = {
  config: {
    name: "adduser",
    aliases: ["add"],
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 1,
    shortDescription: "Add user to group",
    longDescription: "Adds a user to the group by ID or profile link",
    category: "group",
    guide: "{pn} [userID or FB profile link]"
  },

  onStart: async function ({ message, event, args, api }) {
    const threadID = event.threadID;

    if (!args[0]) return message.reply("⚠️ Please provide a user ID or Facebook profile link.");

    let uid = args[0];

    // If it's a profile link, extract user ID
    if (uid.includes("facebook.com")) {
      message.reply("🔎 Fetching user ID from profile link...");
      try {
        const res = await axios.get(`https://api.popcat.xyz/fbinfo?user=${encodeURIComponent(uid)}`);
        if (!res.data || !res.data.id) throw new Error("Invalid profile");
        uid = res.data.id;
      } catch (err) {
        return message.reply("❌ Failed to get user ID from profile link. Make sure it's public.");
      }
    }

    // Try to add the user
    try {
      await api.addUserToGroup(uid, threadID);
      message.reply(`✅ Successfully added user: ${uid}`);
    } catch (err) {
      let reason = "Unknown error";
      if (err.errorDescription?.includes("not friends")) reason = "Bot is not friends with the user.";
      else if (err.errorDescription?.includes("already")) reason = "User is already in the group.";
      else if (err.errorDescription?.includes("privacy")) reason = "User's privacy settings prevent adding.";
      message.reply(`❌ Failed to add user ${uid}.\nReason: ${reason}`);
    }
  }
};
