const axios = require('axios');

module.exports = {
    config: {
        name: "dictionary",
        aliases: ["define"],
        author: "Hassan",
        version: "1.0",
        shortDescription: "Get the definition of a word",
        longDescription: "Retrieve the definition of a specified word using the Hassan Dictionary API.",
        category: "education",
        guide: {
            en: "{pn} <word>"
        },
        usePrefix: true
    },

    onStart: async function ({ message, args }) {
        if (!args[0]) {
            return message.reply("⚠️ Please provide a word to define.");
        }

        const word = args[0];
        const url = `https://hassan-dictionary-api.onrender.com/dictionary/${word}`;

        try {
            await message.reply(`🔍 Searching for the definition of "${word}"...`);
            const response = await axios.get(url);
            const data = response.data;

            if (!data.valid) {
                return message.reply(`❌ No definition found for "${word}".`);
            }

            return message.reply(`📖 Definition of "${word}":\n\n${data.definition}`);
        } catch (err) {
            console.error(err);
            return message.reply("❌ Failed to fetch definition.");
        }
    }
};
