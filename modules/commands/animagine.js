const axios = require('axios');

module.exports = {
  config: {
    name: "animagine",
    version: "1.1",
    author: "Team Calyx",
    role: 0,
    shortDescription: {
      en: 'Text to Anime Image'
    },
    category: "ai",
    guide: {
      en: `{p}{n} <prompt> --ar <ratio> --s <styleNumber>
Models:
1: anime
2: ghibli1
3: ghibli2
4: ghibli3`
    }
  },

  onStart: async function ({ message, api, args, event }) {
    if (!args.length) {
      return message.reply("⚠️ Usage:\nanimagine <prompt> [--ar=<ratio>] [--s=<styleNumber>]");
    }

    // Default values
    let ratio = '1:1';
    let styleNum = '1';
    const styleMap = {
      '1': 'anime',
      '2': 'ghibli1',
      '3': 'ghibli2',
      '4': 'ghibli3'
    };

    // Handle aspect ratio
    const eqArIndex = args.findIndex(a => a.startsWith('--ar='));
    if (eqArIndex !== -1) {
      ratio = args[eqArIndex].split('=')[1] || ratio;
      args.splice(eqArIndex, 1);
    } else {
      const flagArIndex = args.findIndex(a => a === '--ar');
      if (flagArIndex !== -1 && args[flagArIndex + 1]) {
        ratio = args[flagArIndex + 1];
        args.splice(flagArIndex, 2);
      }
    }

    // Handle style
    const eqStyleIndex = args.findIndex(a => a.startsWith('--s='));
    if (eqStyleIndex !== -1) {
      styleNum = args[eqStyleIndex].split('=')[1] || styleNum;
      args.splice(eqStyleIndex, 1);
    } else {
      const flagStyleIndex = args.findIndex(a => a === '--s');
      if (flagStyleIndex !== -1 && args[flagStyleIndex + 1]) {
        styleNum = args[flagStyleIndex + 1];
        args.splice(flagStyleIndex, 2);
      }
    }

    const prompt = args.join(" ").trim();
    if (!prompt) {
      return message.reply("⚠️ Please provide a prompt. Example:\nanimagine a cat warrior --ar=2:3 --s=2");
    }

    const style = styleMap[styleNum] || 'anime';
    const apiUrl = `https://smfahim.xyz/animagine?prompt=${encodeURIComponent(prompt)}&ratio=${encodeURIComponent(ratio)}&style=${encodeURIComponent(style)}`;

    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    try {
      const res = await axios.get(apiUrl);
      if (!res.data || !res.data.success || !res.data.image) {
        throw new Error("Invalid response or no image returned.");
      }

      const imgStream = await global.utils.getStreamFromURL(res.data.image);
      await message.reply({ body: `🖼️ Generated Image for: ${prompt}`, attachment: imgStream });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("Animagine Error:", err.message);
      await message.reply("❌ Failed to generate image. Please try again later.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
