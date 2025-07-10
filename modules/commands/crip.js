const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "crip",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate AI image",
    longDescription: "Generate a photorealistic image using your own Crip API.",
    category: "image",
    guide: "{pn} [your prompt]\nExample: {pn} astronaut dog on mars"
  },

  onStart: async function ({ event, message, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please enter a prompt.\nExample: crip astronaut dog on mars");
    }

    const apiUrl = "https://hassan-crip.onrender.com/api/crip"; 

    try {
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        responseType: 'arraybuffer',
        data: { prompt },
        headers: { 'Content-Type': 'application/json' }
      });

      const imgPath = path.join(__dirname, "crip_output.png");
      fs.writeFileSync(imgPath, response.data);

      return message.reply({
        body: `✅ Here's your generated image for:\n"${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath)); // Clean up file after sending
    } catch (err) {
      console.error("❌ Crip API Error:", err.message);
      return message.reply("❌ Error generating image. Please try again later.");
    }
  }
};
