module.exports = {
  config: {
    name: "unsend",
    version: "2.1",
    hasPermssion: 1, // Bot admins only
    credits: "Hassan",
    description: "Silently unsends a replied message.",
    commandCategory: "Admin",
    usages: "Reply to a message and type: unsend",
    cooldowns: 5,
    usePrefix: true,
    aliases: ["delete", "remove"]
  },

  run: async function ({ api, event, global }) {
    const { threadID, messageID, messageReply, senderID } = event;

    // Only allow bot admins
    if (!global.config.ADMINBOT.includes(senderID)) return;

    // Must reply to a message
    if (!messageReply || !messageReply.messageID) return;

    // Try to unsend the message
    try {
      await api.unsendMessage(messageReply.messageID);
    } catch (err) {
      console.error("[UNSEND ERROR]:", err);
    }

    // Do not send any message back
    return;
  }
};
