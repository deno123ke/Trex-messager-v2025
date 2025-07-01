const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

module.exports = {
  config: {
    name: "install2",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 2, // Admin only
    shortDescription: {
      en: "Install new commands from URL or file"
    },
    longDescription: {
      en: "Install new command files from a direct URL or uploaded file"
    },
    category: "system",
    guide: {
      en: "{pn} [url] or reply to an attachment"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      // Check if user provided a URL
      if (args[0] && args[0].startsWith('http')) {
        await installFromUrl(api, event, args[0], message);
        return;
      }

      // Check for attachment
      if (event.type === "message_reply" && event.messageReply.attachments && 
          event.messageReply.attachments.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "file") {
          await installFromAttachment(api, event, attachment, message);
          return;
        }
      }

      // If no URL or attachment
      message.reply("Please provide a direct download URL for the command file or reply to a file attachment.");
    } catch (err) {
      message.reply(`❌ Error: ${err.message}`);
      console.error(err);
    }
  }
};

async function installFromUrl(api, event, url, message) {
  try {
    const response = await message.reply("⏳ Downloading command file...");
    
    // Download the file
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const fileName = path.basename(url).replace(/\?.*$/, '');
    
    if (!fileName.endsWith('.js')) {
      await api.unsendMessage(response.messageID);
      return message.reply("❌ The file must be a JavaScript file (.js)");
    }

    const filePath = path.join(__dirname, '../commands', fileName);
    
    // Save the file
    await fs.writeFile(filePath, res.data);
    
    // Load the command
    try {
      await global.client.loadCommand(fileName);
      await api.unsendMessage(response.messageID);
      message.reply(`✅ Successfully installed command: ${fileName}\nType "${global.config.PREFIX}${fileName.replace('.js', '')}" to use it.`);
    } catch (loadErr) {
      await fs.remove(filePath); // Remove if loading failed
      await api.unsendMessage(response.messageID);
      message.reply(`❌ Failed to load command: ${loadErr.message}`);
    }
  } catch (err) {
    message.reply(`❌ Download failed: ${err.message}`);
  }
}

async function installFromAttachment(api, event, attachment, message) {
  try {
    const response = await message.reply("⏳ Processing uploaded file...");
    
    // Download the attachment
    const res = await axios.get(attachment.url, { responseType: 'arraybuffer' });
    const fileName = attachment.name;
    
    if (!fileName.endsWith('.js')) {
      await api.unsendMessage(response.messageID);
      return message.reply("❌ The file must be a JavaScript file (.js)");
    }

    const filePath = path.join(__dirname, '../commands', fileName);
    
    // Save the file
    await fs.writeFile(filePath, res.data);
    
    // Load the command
    try {
      await global.client.loadCommand(fileName);
      await api.unsendMessage(response.messageID);
      message.reply(`✅ Successfully installed command: ${fileName}\nType "${global.config.PREFIX}${fileName.replace('.js', '')}" to use it.`);
    } catch (loadErr) {
      await fs.remove(filePath); // Remove if loading failed
      await api.unsendMessage(response.messageID);
      message.reply(`❌ Failed to load command: ${loadErr.message}`);
    }
  } catch (err) {
    message.reply(`❌ File processing failed: ${err.message}`);
  }
}
