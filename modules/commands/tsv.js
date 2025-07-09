const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

module.exports = {
config: {
name: "tsv",
version: "1.2",
author: "Hassan",
description: "Transcribe spoken content from a video using AI and send the result as plain text.",
commandCategory: "tools",
cooldowns: 5,
usePrefix: true,
},

run: async function ({ api, event, args }) {
const videoMessage = event.messageReply;

if (  
  !videoMessage ||  
  !videoMessage.attachments ||  
  videoMessage.attachments[0].type !== "video"  
) {  
  return api.sendMessage(  
    "❌ Please reply to a video message to transcribe.",  
    event.threadID,  
    event.messageID  
  );  
}  

const languageCode = args[0] || "en"; // Default to English or use "auto" to let AssemblyAI detect it  
const fileUrl = videoMessage.attachments[0].url;  
const basePath = path.join(__dirname, "cache", event.senderID + "_transcription");  
const videoPath = basePath + ".mp4";  
const audioPath = basePath + ".mp3";  

try {  

  const video = await axios.get(fileUrl, { responseType: "stream" });  
  fs.mkdirSync(path.dirname(videoPath), { recursive: true });  
  const writer = fs.createWriteStream(videoPath);  
  video.data.pipe(writer);  
  await new Promise((resolve, reject) => {  
    writer.on("finish", resolve);  
    writer.on("error", reject);  
  });  

  await new Promise((resolve, reject) => {  
    exec(`ffmpeg -i "${videoPath}" -q:a 0 -map a "${audioPath}" -y`, (err) => {  
      if (err) return reject(err);  
      resolve();  
    });  
  });  
  
  const audioData = fs.readFileSync(audioPath);  
  const uploadRes = await axios.post("https://api.assemblyai.com/v2/upload", audioData, {  
    headers: {  
      authorization: "dcd307c8157c4a8bb48e0c5425d51697",  
      "content-type": "application/octet-stream",  
    },  
  });  

  const audioUrl = uploadRes.data.upload_url;  

  // Start transcription  
  const transcriptPayload = {  
    audio_url: audioUrl,  
  };  

  if (languageCode !== "auto") {  
    transcriptPayload.language_code = languageCode;  
  }  

  const transcriptRes = await axios.post(  
    "https://api.assemblyai.com/v2/transcript",  
    transcriptPayload,  
    {  
      headers: {  
        authorization: "dcd307c8157c4a8bb48e0c5425d51697",  
      },  
    }  
  );  

  const transcriptId = transcriptRes.data.id;  

  // Poll for result  
  let status = "queued";  
  let transcriptText = "";  

  while (status !== "completed" && status !== "error") {  
    await new Promise((resolve) => setTimeout(resolve, 4000));  
    const pollingRes = await axios.get(  
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,  
      {  
        headers: {  
          authorization: "dcd307c8157c4a8bb48e0c5425d51697",  
        },  
      }  
    );  
    status = pollingRes.data.status;  
    transcriptText = pollingRes.data.text;  
  }  

  // Cleanup  
  fs.unlinkSync(videoPath);  
  fs.unlinkSync(audioPath);  

  if (status === "completed") {  
    return api.sendMessage(  
      `📝 Transcription completed:\n\n${transcriptText}`,  
      event.threadID,  
      event.messageID  
    );  
  } else {  
    return api.sendMessage("❌ Transcription failed.", event.threadID, event.messageID);  
  }  
} catch (error) {  
  console.error("Video Transcription Error:", error.message);  
  return api.sendMessage("❌ An error occurred during transcription.", event.threadID, event.messageID);  
}

},
};
