const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pickfile",
    version: "1.0",
    hasPermssion: 1, // Bot Admin
    credits: "Hassan",
    description: "Install a command by replying to a .js file or using inline code.",
    commandCategory: "Admin",
    usages: "pickfile <filename.js> <code>",
    cooldowns: 5,
    usePrefix: true
  },

  run: async function ({ api, event, args, global }) {
    const { threadID, messageID, senderID, messageReply } = event;

    // Check admin permission
    if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage("⛔ You are not authorized to use this command.", threadID, messageID);
    }

    // Handle reply with attachment
    if (messageReply && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];

      if (attachment.type !== "file" || !attachment.name.endsWith(".js")) {
        return api.sendMessage("❗ Please reply to a message that includes a `.js` file.", threadID, messageID);
      }

      const filePath = path.join(__dirname, attachment.name);
      const writer = fs.createWriteStream(filePath);

      const stream = await global.getStream(attachment.url);
      stream.pipe(writer);

      writer.on("finish", async () => {
        const success = await global.client.loadCommand(attachment.name);
        if (success) {
          return api.sendMessage(`✅ Installed command: ${attachment.name}`, threadID, messageID);
        } else {
          return api.sendMessage(`⚠️ Saved ${attachment.name}, but failed to load.`, threadID, messageID);
        }
      });

      writer.on("error", (err) => {
        return api.sendMessage("❌ Error writing file: " + err.message, threadID, messageID);
      });

      return;
    }

    // Handle inline method: pickfile filename.js code...
    if (args.length >= 2) {
      const fileName = args[0];
      const code = args.slice(1).join(" ");

      if (!fileName.endsWith(".js")) {
        return api.sendMessage("❗ File name must end in `.js`.", threadID, messageID);
      }

      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, code, "utf8");

      const success = await global.client.loadCommand(fileName);
      if (success) {
        return api.sendMessage(`✅ Command '${fileName}' installed and loaded.`, threadID, messageID);
      } else {
        return api.sendMessage(`⚠️ File saved but failed to load '${fileName}'.`, threadID, messageID);
      }
    }

    return api.sendMessage("❗ Please reply to a message or send a message that includes a `.js` file to install.\nOr use: `pickfile <filename.js> <code>`", threadID, messageID);
  }
};
