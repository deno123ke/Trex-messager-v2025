const axios = require("axios");

module.exports = {
  config: {
    name: "gpt3",
    aliases: ["gpt", "chatgpt"],
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hassan via OpenRouter",
    description: "Ask GPT-3.5 anything",
    commandCategory: "ai",
    usages: "gpt3 <question or reply to message>",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args }) {
    const apiKey = "your_openrouter_api_key_here"; // <- replace with your actual key from openrouter.ai

    let userPrompt = args.join(" ");
    if (!userPrompt && event.messageReply?.body) {
      userPrompt = event.messageReply.body;
    }

    if (!userPrompt) {
      return api.sendMessage("❌ | Please provide a question or reply to a message.", event.threadID, event.messageID);
    }

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "user", content: userPrompt }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = response.data.choices[0].message.content;
      return api.sendMessage(`🤖 ${reply}`, event.threadID, event.messageID);

    } catch (error) {
      console.error("GPT-3 ERROR:", error.message || error);
      return api.sendMessage("❌ | Failed to get response from GPT-3.5.", event.threadID, event.messageID);
    }
  }
};
