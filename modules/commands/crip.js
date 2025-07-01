const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

module.exports = {
  config: {
    name: "crip",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate AI image ",
    longDescription: "Generate a photorealistic image using the Clip... Text-to-Image API.",
    category: "image",
    guide: "{pn} [your prompt]\nExample: {pn} vaporwave fashion dog in miami"
  },

  onStart: async function ({ event, message, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please enter a prompt.\nExample: crip vaporwave fashion dog in miami");
    }

    const form = new FormData();
    form.append("prompt", prompt);

    const apiKey = "3b805b36da5054768ba24d0fbd42ca96f375845d0cea06a27d901055cce2e6d33a1b2e7154ae64e28bb4c48aca47aab7";

    try {
      const res = await fetch("https://clipdrop-api.co/text-to-image/v1", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          ...form.getHeaders()
        },
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        return message.reply(`❌ Error from API: ${text}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const imgPath = __dirname + "/crip_image.png";
      fs.writeFileSync(imgPath, buffer);

      return message.reply({
        body: `✨ Here's your generated image: "${prompt}"`,
        attachment: fs.createReadStream(imgPath)
      }, () => fs.unlinkSync(imgPath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to generate image. Try again later.");
    }
  }
};
