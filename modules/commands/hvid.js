const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "hvid", // You can change the command name here
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate video from text using Hunyuan" },
    longDescription: { en: "Generate AI video from a prompt using Wavespeed's Hunyuan model." },
    category: "ai",
    guide: { en: "{pn} <prompt>\nExample: ?hunyuanvid a dog running on Mars" }
  },

  onStart: async function ({ api, event, args }) {
    const API_KEY = "ba22a1c6d520bfedf77c0630221544d295353c33a5d22f5dc77846cf4b412de1";
    const API_URL = "https://api.wavespeed.ai/api/v3/wavespeed-ai/hunyuan-video/t2v";
    const POLL_URL = "https://api.wavespeed.ai/api/v3/predictions";

    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage("⚠️ Please provide a prompt.\nExample: ?hunyuanvid a dragon flying through mountains", event.threadID, event.messageID);
    }

    api.sendMessage("🎬 | Generating your AI video, please wait...", event.threadID, async (err, info) => {
      const loadingMsgID = info?.messageID;

      try {
        // Step 1: Submit generation task
        const submit = await axios.post(API_URL, {
          prompt,
          size: "1280*720",
          seed: -1,
          num_inference_steps: 30,
          enable_safety_checker: true
        }, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const predictionId = submit.data?.data?.id;
        if (!predictionId) throw new Error("❌ No prediction ID returned.");

        // Step 2: Poll result
        let videoUrl = null;
        for (let i = 0; i < 60; i++) {
          const poll = await axios.get(`${POLL_URL}/${predictionId}/result`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
          });

          const status = poll.data?.data?.status;

          if (status === "completed") {
            videoUrl = poll.data?.data?.outputs?.[0];
            break;
          }

          if (status === "failed") {
            const errMsg = poll.data?.data?.error || "Unknown error.";
            throw new Error(`❌ Generation failed: ${errMsg}`);
          }

          await new Promise(res => setTimeout(res, 3000));
        }

        if (!videoUrl) throw new Error("❌ Timed out waiting for video generation.");

        // Step 3: Download video
        const tempPath = path.join(__dirname, "hunyuan_video.mp4");
        const stream = await axios.get(videoUrl, { responseType: "stream" });
        const writer = fs.createWriteStream(tempPath);

        stream.data.pipe(writer);
        writer.on("finish", async () => {
          await api.sendMessage({
            body: `✅ Prompt: ${prompt}\n🎥 Your video is ready.`,
            attachment: fs.createReadStream(tempPath)
          }, event.threadID, event.messageID);
          fs.unlinkSync(tempPath);
          if (loadingMsgID) api.unsendMessage(loadingMsgID);
        });

        writer.on("error", e => {
          throw new Error("❌ Failed to save video: " + e.message);
        });

      } catch (err) {
        if (loadingMsgID) api.unsendMessage(loadingMsgID);

        if (err.response?.status === 403) {
          api.sendMessage("❌ 403 Forbidden: Your API key may be invalid or unauthorized for this model.", event.threadID, event.messageID);
        } else {
          api.sendMessage("❌ Failed: " + err.message, event.threadID, event.messageID);
        }
      }
    });
  }
};
