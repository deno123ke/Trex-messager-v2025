module.exports = {
  config: {
    name: "tid",
    aliases: ["threadid", "id"],
    version: "1.0",
    author: "Hassan",
    countDown: 3,
    role: 0,
    shortDescription: "Get thread ID",
    longDescription: "Returns only the thread ID for this chat",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    return message.reply(event.threadID.toString());
  }
};
