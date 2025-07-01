const axios = require("axios");

module.exports = {
  config: {
    name: "kick",
    aliases: ["remove", "kickuser"],
    version: "2.1",
    author: "Hassan",
    countDown: 5,
    role: 1,
    shortDescription: "Remove user from group",
    longDescription: "Remove a user using tag, reply, user ID, or profile link. Checks bot/admin roles.",
    category: "group",
    guide: "{pn} [@tag | reply | UID | FB link]"
  },

  onStart: async function ({ message, event, args, api }) {
    const threadID = event.threadID;
    let uid;

    // ✅ Get target UID
    if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions || {}).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (args[0]) {
      uid = args[0];
      if (uid.includes("facebook.com")) {
        message.reply("🔎 Getting user ID from link...");
        try {
          const res = await axios.get(`https://api.popcat.xyz/fbinfo?user=${encodeURIComponent(uid)}`);
          if (!res.data?.id) throw new Error("Invalid link");
          uid = res.data.id;
        } catch (err) {
          return message.reply("❌ Failed to get ID from profile link. Make sure it's public.");
        }
      }
    }

    if (!uid) return message.reply("⚠️ Please tag, reply to, or provide a user ID/link to remove.");

    // ✅ Get thread info to check admin status
    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch (err) {
      return message.reply("❌ Failed to get thread info.");
    }

    const botID = api.getCurrentUserID();
    const admins = threadInfo.adminIDs.map(e => e.id);

    // ✅ Check if bot is admin
    if (!admins.includes(botID)) {
      return message.reply("⚠️ Please make the bot an admin to kick members.");
    }

    // 🚫 Check if target is admin
    if (admins.includes(uid)) {
      return message.reply("❌ Cannot kick this user because they are a group admin.");
    }

    // ✅ Attempt to remove
    try {
      await api.removeUserFromGroup(uid, threadID);
      message.reply(`✅ Removed user: ${uid}`);
    } catch (err) {
      let reason = "Unknown error.";
      if (err.errorDescription?.includes("not in thread")) reason = "User is not in the group.";
      else if (err.errorDescription?.includes("permission")) reason = "Bot lacks permission to remove this user.";
      message.reply(`❌ Failed to remove user ${uid}.\nReason: ${reason}`);
    }
  }
};
