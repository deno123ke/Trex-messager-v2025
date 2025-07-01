const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pickf",
    version: "2.0",
    hasPermssion: 1,
    credits: "Hassan",
    description: "Install commands with persistence",
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

    // Load persistent data
    const persistentFile = path.join(__dirname, '..', 'data', 'persistent.json');
    const loadData = () => {
      try {
        return fs.existsSync(persistentFile) 
          ? JSON.parse(fs.readFileSync(persistentFile))
          : { commands: [], admins: global.config.ADMINBOT || [], settings: {} };
      } catch (e) {
        console.error("Load error:", e);
        return { commands: [], admins: global.config.ADMINBOT || [], settings: {} };
      }
    };

    const saveData = (data) => {
      try {
        fs.writeFileSync(persistentFile, JSON.stringify(data, null, 2));
        return true;
      } catch (e) {
        console.error("Save error:", e);
        return false;
      }
    };

    // Handle file attachment
    if (messageReply && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];

      if (attachment.type !== "file" || !attachment.name.endsWith(".js")) {
        return api.sendMessage("❗ Please reply to a .js file attachment.", threadID, messageID);
      }

      const filePath = path.join(__dirname, attachment.name);
      const writer = fs.createWriteStream(filePath);

      try {
        const stream = await global.getStream(attachment.url);
        stream.pipe(writer);

        return new Promise((resolve) => {
          writer.on("finish", async () => {
            const success = await global.client.loadCommand(attachment.name);
            if (success) {
              // Update persistent data
              const data = loadData();
              if (!data.commands.includes(attachment.name)) {
                data.commands.push(attachment.name);
                saveData(data);
              }
              resolve(api.sendMessage(`✅ Installed and persisted: ${attachment.name}`, threadID, messageID));
            } else {
              resolve(api.sendMessage(`⚠️ Saved but failed to load: ${attachment.name}`, threadID, messageID));
            }
          });

          writer.on("error", (err) => {
            resolve(api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID));
          });
        });
      } catch (err) {
        return api.sendMessage(`❌ Download error: ${err.message}`, threadID, messageID);
      }
    }

    // Handle inline code
    if (args.length >= 2) {
      const fileName = args[0];
      const code = args.slice(1).join(" ");

      if (!fileName.endsWith(".js")) {
        return api.sendMessage("❗ Filename must end with .js", threadID, messageID);
      }

      const filePath = path.join(__dirname, fileName);
      
      try {
        fs.writeFileSync(filePath, code, "utf8");
        const success = await global.client.loadCommand(fileName);
        
        if (success) {
          // Update persistent data
          const data = loadData();
          if (!data.commands.includes(fileName)) {
            data.commands.push(fileName);
            saveData(data);
          }
          return api.sendMessage(`✅ Installed and persisted: ${fileName}`, threadID, messageID);
        } else {
          return api.sendMessage(`⚠️ Saved but failed to load: ${fileName}`, threadID, messageID);
        }
      } catch (err) {
        return api.sendMessage(`❌ File error: ${err.message}`, threadID, messageID);
      }
    }

    return api.sendMessage(
      "📝 Usage:\n" +
      "1. Reply to a .js file attachment\n" +
      "2. Or: pickfile <filename.js> <code>",
      threadID, messageID
    );
  }
};
