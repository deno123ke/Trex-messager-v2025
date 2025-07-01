const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "gprompt",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Hassan + Gemini API",
    description: "Get a prompt or description from an image using Gemini Vision",
    commandCategory: "ai",
    usages: "gprompt <reply to image>",
    cooldowns: 5,
    usePrefix: true,
    aliases: ["gdesc", "geminiprompt"]
  },

  run: async function ({ api, event }) {
    const attachments = event.messageReply?.attachments;
    if (!attachments || attachments.length === 0 || attachments[0].type !== "photo") {
      return api.sendMessage("Please reply to an image to extract its prompt.", event.threadID, event.messageID);
    }

    try {
      const imageStream = await getStreamFromURL(attachments[0].url);
      const filePath = path.join(__dirname, "temp.jpg");
      const writer = fs.createWriteStream(filePath);
      imageStream.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const base64Image = fs.readFileSync(filePath, { encoding: "base64" });

      const payload = {
        contents: [
          {
            parts: [
              {
                text: "Describe this image in detail for prompt use:"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=AIzaSyB4f2iso5m9aSz84A57tmd-A597X-4nIMo",
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      fs.unlinkSync(filePath); // Clean up the downloaded image

      const description = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (description) {
        return api.sendMessage(description, event.threadID, event.messageID);
      } else {
        return api.sendMessage("Failed to extract prompt from the image.", event.threadID, event.messageID);
      }

    } catch (error) {
      console.error("Gemini Prompt Error:", error);
      return api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
