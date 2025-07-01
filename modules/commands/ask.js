module.exports = {
  config: {
    name: "ask",
    version: "1.0",
    hasPermssion: 0,
    credits: "Hassan",
    description: "Ask a question and wait for reply",
    commandCategory: "games",
    usages: "[question]",
    cooldowns: 5
  },

  onStart: async function({ event, message, args }) {
    const question = args.join(" ") || "What's your favorite color?";
    
    const sentMessage = await message.reply(`🤔 ${question}\n\nPlease reply to this message with your answer!`);
    
    // Store reply handler
    global.client.handleReply.set(sentMessage.messageID, {
      commandName: this.config.name,
      author: event.senderID,
      question: question
    });
  },

  onReply: async function({ event, Reply, message }) {
    if (Reply.author !== event.senderID) {
      return message.reply("❌ Only the original asker can answer this!");
    }
    
    await message.reply(`📝 You answered: "${event.body}"\n\nFor question: "${Reply.question}"`);
    
    // Clean up
    global.client.handleReply.delete(event.messageReply.messageID);
  }
};
