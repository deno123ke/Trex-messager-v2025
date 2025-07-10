const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);

module.exports = {
  config: {
    name: "nsfwcheck",
    version: "1.1",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Check if an image is NSFW" },
    longDescription: { en: "Analyze an image via URL or by replying to an image to detect NSFW content." },
    category: "ai",
    guide: {
      en: "{pn} <image_url>\nOr reply to an image with: {pn}"
    }
  },

  onStart: async function ({ api, event, args }) {
    const apiKey = "fe76fc8056msh60603dd89f8ec42p1a6827jsnab1bbf68fabc";
    const replied = event.messageReply;
    let imageUrl = args[0];

    // Check if user replied to an image
    if (replied?.attachments?.[0]?.type === "photo") {
      const attachmentUrl = replied.attachments[0].url;
      if (!attachmentUrl) {
        return api.sendMessage("❌ Couldn't extract image from the reply.", event.threadID, event.messageID);
      }

      imageUrl = attachmentUrl;
    }

    // If still no image, and no URL, error
    if (!imageUrl || !imageUrl.startsWith("http")) {
      return api.sendMessage("⚠️ Please provide an image URL or reply to an image.\nExample: ?nsfwcheck https://example.com/image.jpg", event.threadID, event.messageID);
    }

    api.sendMessage("🔍 Analyzing image for NSFW content...", event.threadID, async (err, info) => {
      const loadingMsgID = info?.messageID;

      try {
        const formData = new URLSearchParams();
        formData.append("url", imageUrl);

        const response = await axios.post(
          "https://nsfw3.p.rapidapi.com/v1/results",
          formData.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "x-rapidapi-host": "nsfw3.p.rapidapi.com",
              "x-rapidapi-key": apiKey
            }
          }
        );

        const result = response.data?.results?.[0];
        const nsfwScore = result?.entities?.[0]?.classes?.nsfw ?? null;
        const sfwScore = result?.entities?.[0]?.classes?.sfw ?? null;

        if (nsfwScore === null || sfwScore === null) {
          throw new Error("Could not extract NSFW/SFW scores.");
        }

        const nsfwPercent = (nsfwScore * 100).toFixed(2);
        const sfwPercent = (sfwScore * 100).toFixed(2);
        const verdict = nsfwScore > 0.6 ? "🚫 This image is likely NSFW." : "✅ This image appears safe for work.";

        await api.sendMessage(
          `📊 NSFW Analysis Result:\n\n🔞 NSFW: ${nsfwPercent}%\n🧑‍💼 SFW: ${sfwPercent}%\n\n${verdict}`,
          event.threadID,
          event.messageID
        );

        if (loadingMsgID) api.unsendMessage(loadingMsgID);
      } catch (err) {
        if (loadingMsgID) api.unsendMessage(loadingMsgID);
        return api.sendMessage("❌ Failed to analyze image: " + err.message, event.threadID, event.messageID);
      }
    });
  }
};
