const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "botRemovalNotifier",
    version: "1.0",
    author: "Hassan",
    description: "Notifies admin when bot is removed from a group",
    eventType: "log:unsubscribe"
  },

  onChat: async function({ api, event, threadsData }) {
    try {
      // Check if the removed participant is the bot itself
      if (event.logMessageData.leftParticipantFbId === api.getCurrentUserID()) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const adminIDs = global.config.ADMINBOT || [];
        
        // Prepare notification message
        const msg = `⚠️ BOT REMOVAL ALERT ⚠️\n` +
                    `• Group Name: ${threadInfo.threadName || "Unknown"}\n` +
                    `• Group ID: ${event.threadID}\n` +
                    `• Removed at: ${new Date().toLocaleString()}\n` +
                    `• Action: ${event.logMessageData.actorFbId ? "Removed by member" : "Unknown"}`;

        // Send notification to all admins
        for (const adminID of adminIDs) {
          try {
            await api.sendMessage(msg, adminID);
            console.log(`Notified admin ${adminID} about removal from group ${event.threadID}`);
          } catch (e) {
            console.error(`Failed to notify admin ${adminID}:`, e);
          }
        }

        // Optional: Log to file
        const logEntry = `${new Date().toISOString()} - Removed from ${threadInfo.threadName} (${event.threadID})\n`;
        const logPath = path.join(__dirname, '..', 'data', 'bot_removal.log');
        await fs.appendFile(logPath, logEntry);
      }
    } catch (error) {
      console.error("Error in botRemovalNotifier:", error);
    }
  }
};
