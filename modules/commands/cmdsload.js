const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "cmdsload",
    version: "2.0",
    author: "Hassan",
    role: 1, 
    shortDescription: "Load all persistent commands",
    longDescription: "Reloads all commands stored in persistent.json",
    category: "admin",
    guide: {
      en: "{pn} - Reload all commands"
    }
  },

  onStart: async function({ api, event, message }) {
    try {
      const persistentFile = path.join(__dirname, '..', 'data', 'persistent.json');
      
      if (!fs.existsSync(persistentFile)) {
        return message.reply("❌ No persistent data found. Install commands first.");
      }

      const data = JSON.parse(fs.readFileSync(persistentFile, 'utf8'));
      const commandsDir = path.join(__dirname, '..', 'commands');
      
      let successCount = 0;
      let failCount = 0;
      const failedCommands = [];

      for (const cmd of data.commands) {
        const cmdPath = path.join(commandsDir, cmd);
        
        if (fs.existsSync(cmdPath)) {
          try {
            delete require.cache[require.resolve(cmdPath)];
            const success = await global.client.loadCommand(cmd);
            
            if (success) {
              successCount++;
            } else {
              failCount++;
              failedCommands.push(cmd);
            }
          } catch (e) {
            failCount++;
            failedCommands.push(`${cmd} (${e.message})`);
          }
        } else {
          failCount++;
          failedCommands.push(`${cmd} (File missing)`);
        }
      }

      let report = `🔧 Command Load Report:\n\n` +
                  `✅ Successfully loaded: ${successCount}\n` +
                  `❌ Failed to load: ${failCount}`;
      
      if (failedCommands.length > 0) {
        report += `\n\nFailed commands:\n- ${failedCommands.join('\n- ')}`;
      }

      return message.reply(report);
    } catch (err) {
      console.error('[CMDSLOAD ERROR]', err);
      return message.reply(`❌ An error occurred: ${err.message}`);
    }
  }
};
