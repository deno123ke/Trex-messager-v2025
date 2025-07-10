const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "gen2", 
    version: "2.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate hyper-realistic AI images using Flux LoRA" },
    longDescription: { en: "Use Flux Dev LoRA to generate images with advanced prompts, aspect ratios, and style settings." },
    category: "ai",
    guide: { en: "{pn} <prompt> --ar 4:5\nExample: ?fluxlora a fox on a cliff --ar 9:16" }
  },

  onStart: async function ({ api, event, args }) {
    const API_KEY = "ba22a1c6d520bfedf77c0630221544d295353c33a5d22f5dc77846cf4b412de1";
    const API_URL = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-dev-lora";
    const POLL_URL = "https://api.wavespeed.ai/api/v3/predictions";

    let fullInput = args.join(" ");

    // Default aspect ratio and size
    let width = 1024;
    let height = 1024;

    // Parse aspect ratio
    const arRegex = /--ar\s+(\d+):(\d+)/i;
    const arMatch = fullInput.match(arRegex);
    if (arMatch) {
      const w = parseInt(arMatch[1]);
      const h = parseInt(arMatch[2]);
      if (w > 0 && h > 0) {
        height = Math.round((h / w) * width);
      }
      fullInput = fullInput.replace(arRegex, "").trim();
    }

    const prompt = fullInput.trim();
    if (!prompt) {
      return api.sendMessage("⚠️ Please provide a prompt.\nExample: fluxlora a fox on a cliff --ar 4:5", event.threadID, event.messageID);
    }

    // Send loading message
    api.sendMessage("🎨 | Generating your image with Flux LoRA, please wait...", event.threadID, async (err, info) => {
      const loadingMsgID = info?.messageID;

      try {
        // Step 1: Submit generation task
        const submit = await axios.post(API_URL, {
          prompt,
          image: "",
          strength: 0.8,
          loras: [
            {
              path: "strangerzonehf/Flux-Super-Realism-LoRA",
              scale: 1
            }
          ],
          size: `${width}*${height}`,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          seed: -1,
          enable_base64_output: false,
          enable_safety_checker: true,
          enable_sync_mode: false
        }, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          }
        });

        const predictionId = submit.data?.data?.id;
        if (!predictionId) throw new Error("❌ No prediction ID returned.");

        // Step 2: Poll the result
        let imageUrl = null;
        for (let i = 0; i < 60; i++) {
          const poll = await axios.get(`${POLL_URL}/${predictionId}/result`, {
            headers: { Authorization: `Bearer ${API_KEY}` }
          });

          const status = poll.data?.data?.status;

          if (status === "completed") {
            imageUrl = poll.data?.data?.outputs?.[0];
            break;
          }

          if (status === "failed") {
            const errMsg = poll.data?.data?.error || "Unknown error.";
            throw new Error(`❌ Generation failed: ${errMsg}`);
          }

          await new Promise(res => setTimeout(res, 2000));
        }

        if (!imageUrl) throw new Error("❌ Timed out waiting for image generation.");

        // Step 3: Download image
        const tempPath = path.join(__dirname, "fluxlora_temp.jpg");
        const stream = await axios.get(imageUrl, { responseType: "stream" });
        const writer = fs.createWriteStream(tempPath);

        stream.data.pipe(writer);
        writer.on("finish", async () => {
          await api.sendMessage({
            body: `✅ Prompt: ${prompt}\n🖼 Aspect Ratio: ${width}:${height}`,
            attachment: fs.createReadStream(tempPath)
          }, event.threadID, event.messageID);
          fs.unlinkSync(tempPath);
          if (loadingMsgID) api.unsendMessage(loadingMsgID);
        });

        writer.on("error", e => {
          throw new Error("❌ Failed to save image: " + e.message);
        });

      } catch (err) {
        if (loadingMsgID) api.unsendMessage(loadingMsgID);

        if (err.response?.status === 403) {
          api.sendMessage("❌ 403 Forbidden: Your API key might be invalid or lack access to this model.", event.threadID, event.messageID);
        } else {
          api.sendMessage("❌ Failed: " + err.message, event.threadID, event.messageID);
        }
      }
    });
  }
};
