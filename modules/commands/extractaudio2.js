const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "extractaudio2",
    version: "1.0",
    author: "Hassan",
    description: "Transcribe audio using Ai",
    commandCategory: "tools",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event }) {
    const audioMessage = event.messageReply;

    if (!audioMessage || !audioMessage.attachments || audioMessage.attachments[0].type !== "audio") {
      return api.sendMessage("❌ Please reply to a voice/audio message to transcribe.", event.threadID, event.messageID);
    }

    const fileUrl = audioMessage.attachments[0].url;
    const filePath = path.join(__dirname, "cache", `${event.senderID}_audio.mp3`);

    try {
      // Step 1: Download audio
      const audio = await axios.get(fileUrl, { responseType: "stream" });
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const writer = fs.createWriteStream(filePath);
      audio.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Step 2: Upload to AssemblyAI
      const audioData = fs.readFileSync(filePath);
      const uploadRes = await axios.post("https://api.assemblyai.com/v2/upload", audioData, {
        headers: {
          "authorization": "b57ce6d3b91248e380596837be933d0f",
          "content-type": "application/octet-stream"
        }
      });

      const audioUrl = uploadRes.data.upload_url;

      // Step 3: Start transcription
      const transcriptRes = await axios.post("https://api.assemblyai.com/v2/transcript", {
        audio_url: audioUrl
      }, {
        headers: {
          authorization: "b57ce6d3b91248e380596837be933d0f"
        }
      });

      const transcriptId = transcriptRes.data.id;

      // Step 4: Poll for result
      let status = "queued";
      let transcriptText = "";

      while (status !== "completed" && status !== "error") {
        await new Promise(resolve => setTimeout(resolve, 4000));
        const pollingRes = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { authorization: "b57ce6d3b91248e380596837be933d0f" }
        });
        status = pollingRes.data.status;
        transcriptText = pollingRes.data.text;
      }

      fs.unlinkSync(filePath); // Clean up audio file

      if (status === "completed") {
        return api.sendMessage(`📄 Transcription:\n${transcriptText}`, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ Transcription failed.", event.threadID, event.messageID);
      }

    } catch (error) {
      console.error("Transcription Error:", error.message);
      return api.sendMessage("❌ Transcription failed.", event.threadID, event.messageID);
    }
  }
};
