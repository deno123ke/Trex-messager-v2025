const fs = require("fs");

module.exports.config = {
  name: "notification",
  version: "1.0",
  hasPermssion: 1, // Bot admin only
  credits: "Hassan",
  description: "Send a notification message to all threads",
  commandCategory: "Admin",
  usages: "notification [message]",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["notify", "announce"]
};

module.exports.run = async function ({ api, event, args }) {
  const senderID = event.senderID;
  const message = args.join(" ");

  if (!message) {
    return api.sendMessage("❗ Please provide a message to send.\nUsage: notification [message]", event.threadID, event.messageID);
  }

  // Only allow bot admins to use this
  const botAdmins = ["61555393416824"]; // <-- Replace with your Facebook UID or add more
  if (!botAdmins.includes(senderID)) {
    return api.sendMessage("🚫 You are not authorized to use this command.", event.threadID, event.messageID);
  }

  try {
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);
    let sent = 0, failed = 0;

    for (const thread of allThreads) {
      if (!thread.isGroup && thread.threadID !== event.threadID) continue; // Only send to groups, skip current

      try {
        await api.sendMessage(`📢 Notification:\n\n${message}`, thread.threadID);
        sent++;
      } catch (e) {
        failed++;
        console.error(`[NOTIFY ERROR] Failed to send to ${thread.threadID}:`, e.message);
      }
    }

    return api.sendMessage(`✅ Notification sent to ${sent} thread(s).\n❌ Failed: ${failed}`, event.threadID, event.messageID);

  } catch (err) {
    console.error("[NOTIFICATION CMD ERROR]:", err);
    return api.sendMessage("⚠️ Error: Could not fetch threads or send notifications.", event.threadID, event.messageID);
  }
};
