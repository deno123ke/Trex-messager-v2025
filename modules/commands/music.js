const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "music",
    aliases: ["song", "spotify"],
    version: "1.1",
    author: "Hassan",
    description: "Play a music track by title using Spotify downloader",
    commandCategory: "media",
    usages: "music <song name>",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("🎵 Please enter a song title.\nExample: -music One Love", event.threadID, event.messageID);
    }

    try {
      const res = await axios.get(`https://betadash-api-swordslush-production.up.railway.app/spt?title=${encodeURIComponent(query)}`);
      const { title, duration, thumbnail, download_url, artists } = res.data;

      if (!download_url) {
        return api.sendMessage("❌ No music found for your query.", event.threadID, event.messageID);
      }

      const audioPath = path.join(__dirname, "cache", `${event.senderID}_music.mp3`);
      const audioStream = await axios.get(download_url, { responseType: "stream" });

      // Ensure cache directory exists
      fs.mkdirSync(path.dirname(audioPath), { recursive: true });

      const writer = fs.createWriteStream(audioPath);
      audioStream.data.pipe(writer);

      writer.on("finish", () => {
        const timeMin = Math.floor(duration / 60000);
        const timeSec = ((duration % 60000) / 1000).toFixed(0).padStart(2, '0');

        api.sendMessage({
          body: `🎵 ${title}\n👤 ${artists}\n⏱ ${timeMin}:${timeSec}`,
          attachment: fs.createReadStream(audioPath)
        }, event.threadID, () => fs.unlinkSync(audioPath), event.messageID);
      });

      writer.on("error", (err) => {
        console.error("Download error:", err);
        api.sendMessage("⚠️ Error downloading the music file.", event.threadID, event.messageID);
      });

    } catch (err) {
      console.error("MUSIC CMD ERROR:", err.message || err);
      api.sendMessage("🚨 Failed to fetch or send the music. Try again later.", event.threadID, event.messageID);
    }
  }
};
