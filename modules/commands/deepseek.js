const axios = require('axios');

const OPENAI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = "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";
const MODEL = "deepseek/deepseek-r1:free";
const MAX_TOKENS = 1000;

if (!global.client) global.client = {};
if (!global.client.openaiChats) global.client.openaiChats = new Map();

module.exports = {
  config: {
    name: "deepseek",
    aliases: [],
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "AI assistant using DeepSeek model",
    longDescription: "Chat with the DeepSeek model using OpenRouter API.",
    category: "ai",
    guide: {
      en: "{pn} [prompt] - Ask DeepSeek\n{pn} clear - Reset chat\nReply to image with a question to analyze it"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    await this.handleRequest({ api, event, args, message });
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, senderID } = event;
    if (senderID !== Reply.author) {
      return message.reply("❌ Only the original user can continue this conversation.");
    }

    await this.handleRequest({ api, event, args: event.body.split(' '), message, isReply: true });
  },

  handleRequest: async function ({ api, event, args, message, isReply = false }) {
    const { threadID, senderID, messageReply } = event;
    const chatKey = `${threadID}_${senderID}`;
    let prompt = args.join(" ").trim();

    if (prompt.toLowerCase() === "clear") {
      global.client.openaiChats.delete(chatKey);
      return message.reply("🧹 Conversation history cleared.");
    }

    if (!global.client.openaiChats.has(chatKey)) {
      global.client.openaiChats.set(chatKey, [
        {
          role: "system",
          content: "You are DeepSeek, a helpful and highly intelligent assistant."
        }
      ]);
    }

    const chatHistory = global.client.openaiChats.get(chatKey);

    if ((messageReply && messageReply.attachments) || 
        prompt.toLowerCase().includes("this image") || 
        prompt.toLowerCase().includes("the image")) {
      const imageAttachment = messageReply?.attachments?.find(att => att.type === "photo");
      
      if (imageAttachment) {
        chatHistory.push({
          role: "user",
          content: [
            { type: "text", text: prompt || "What can you tell me about this image?" },
            { type: "image_url", image_url: { url: imageAttachment.url } }
          ]
        });
      } else {
        return message.reply("⚠️ Please reply to an image when asking about images.");
      }
    } else {
      if (!prompt && !isReply) {
        return message.reply(`❓ Please provide your query or reply to an image with a question.
Examples:
• deepseek Explain string theory
• (Reply to image) deepseek Describe this photo
• deepseek clear - Reset conversation`);
      }
      chatHistory.push({ role: "user", content: prompt });
    }

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: MODEL,
          messages: chatHistory,
          max_tokens: MAX_TOKENS
        },
        {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://your-site-url.com", // Optional
            "X-Title": "MyBot" // Optional
          }
        }
      );

      const aiResponse = response.data?.choices?.[0]?.message?.content || "❌ No response generated.";

      chatHistory.push({ role: "assistant", content: aiResponse });

      api.sendMessage(aiResponse, threadID, (err, info) => {
        if (!err) {
          global.api.handleReply.set(info.messageID, {
            name: "deepseek",
            author: senderID,
            threadID,
            chatKey
          });
        }
      }, event.messageID);

    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      let errorMsg = "❌ An error occurred.";
      if (error.response?.status === 429) {
        errorMsg = "⚠️ Rate limit exceeded.";
      } else if (error.response?.data?.error?.message) {
        errorMsg = `API Error: ${error.response.data.error.message}`;
      }
      api.sendMessage(errorMsg, threadID, event.messageID);
    }
  }
};
