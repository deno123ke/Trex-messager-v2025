module.exports = {
  config: {
    name: "supportgc",
    version: "1.1",
    author: "Hassan",
    countDown: 3,
    role: 0,
    shortDescription: "Join the bot support group",
    longDescription: "Automatically adds the user to the official support group chat",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message }) {
    const userID = event.senderID;
    const supportGroupThreadID = "23929593140006925"; // 🔁 Replace with actual group thread ID

    try {
      await api.addUserToGroup(userID, supportGroupThreadID);
      return message.reply("✅ You have been added to the support group successfully!");
    } catch (err) {
      console.error("[supportgc] Error adding user:", err);
      let errorMsg = "❌ Failed to add you to the support group.";
      if (err.message?.includes("user is already in the thread")) {
        errorMsg = "ℹ️ You're already in the support group.";
      } else if (err.message?.includes("Cannot add user to group chat")) {
        errorMsg += " Please make sure you have messaged the bot first.";
      }
      return message.reply(errorMsg);
    }
  }
};
