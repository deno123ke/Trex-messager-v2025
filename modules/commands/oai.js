const axios = require('axios');

// OpenAI configuration
const OPENAI_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = "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"; // Replace with your actual API key
const MODEL = "mistralai/mistral-small-3.2-24b-instruct";
const MAX_TOKENS = 1000;

// Global chat storage
if (!global.client) global.client = {};
if (!global.client.openaiChats) global.client.openaiChats = new Map();

module.exports = {
  config: {
    name: "oai",
    aliases: ["openai"],
    version: "1.2",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "AI assistant with advanced image understanding",
    longDescription: `
Interact with an AI assistant that can deeply analyze images and answer any questions about them.
Features:
- Answer questions about image content
- Describe images in detail
- Analyze visual elements
- Interpret charts/diagrams
- Read text from images (when possible)
- Persistent conversation memory

Usage:
• {pn} [your question] - Get AI response
• {pn} clear - Reset conversation
• Reply to an image with any question - Analyze and answer about the image
    `,
    category: "ai",
    guide: {
      en: "{pn} [prompt] - Get response\n{pn} clear - Reset chat\nReply to image with any question to analyze it"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    await this.handleRequest({ api, event, args, message });
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { threadID, senderID } = event;
    const chatKey = Reply.chatKey;

    if (senderID !== Reply.author) {
      return message.reply("❌ Only the original user can continue this conversation.");
    }

    await this.handleRequest({ api, event, args: event.body.split(' '), message, isReply: true });
  },

  handleRequest: async function ({ api, event, args, message, isReply = false }) {
    const { threadID, senderID, messageReply } = event;
    const chatKey = `${threadID}_${senderID}`;
    let prompt = args.join(" ").trim();

    // Clear chat history
    if (prompt.toLowerCase() === "clear") {
      global.client.openaiChats.delete(chatKey);
      return message.reply("🧹 Conversation history cleared.");
    }

    // Initialize chat history if not exists
    if (!global.client.openaiChats.has(chatKey)) {
      global.client.openaiChats.set(chatKey, [
        {
          role: "system",
          content: `You are a highly capable AI assistant with advanced image understanding. 
          When analyzing images:
          1. Provide detailed descriptions when asked
          2. Answer specific questions about image content
          3. Interpret visual data like charts/graphs
          4. Attempt to read text when possible
          5. Make educated guesses about unclear elements
          6. Point out important visual elements
          7. Provide context where relevant`
        }
      ]);
    }

    const chatHistory = global.client.openaiChats.get(chatKey);

    // Handle image analysis
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
      } else if (prompt.toLowerCase().includes("image")) {
        return message.reply("⚠️ Please reply to an image when asking about images.");
      }
    } 
    // Normal text prompt
    else {
      if (!prompt && !isReply) {
        return message.reply(`Please provide your query or attach an image with your question.
        
Examples:
• openai Explain quantum computing
• (Reply to image) openai What is shown in this image?
• (Reply to image) openai How many people are in this photo?
• (Reply to chart) openai What does this graph show?
• openai clear - Reset conversation`);
      }
      
      chatHistory.push({ role: "user", content: prompt });
    }

    // ✅ Removed history trimming — retains full conversation memory
    // if (chatHistory.length > MAX_HISTORY * 2 + 1) {
    //   chatHistory.splice(1, chatHistory.length - (MAX_HISTORY * 2 + 1));
    // }

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
            "HTTP-Referer": "https://your-site-url.com",
            "X-Title": "Your App Name"
          }
        }
      );

      const aiResponse = response.data?.choices?.[0]?.message?.content || 
                         "I couldn't generate a response.";

      chatHistory.push({ role: "assistant", content: aiResponse });

      api.sendMessage(aiResponse, threadID, (err, info) => {
        if (!err) {
          global.api.handleReply.set(info.messageID, {
            name: "openai",
            author: senderID,
            threadID,
            chatKey
          });
        }
      }, event.messageID);

    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      let errorMsg = "An error occurred. Please try again later.";
      if (error.response?.status === 429) {
        errorMsg = "⚠️ Rate limit exceeded. Please wait before trying again.";
      } else if (error.response?.data?.error?.message) {
        errorMsg = `API Error: ${error.response.data.error.message}`;
      }
      api.sendMessage(errorMsg, threadID, event.messageID);
    }
  }
};
