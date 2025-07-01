const os = require("os");

module.exports.config = {
  name: "stats",
  version: "2.0",
  hasPermssion: 0,
  credits: "Hassan",
  description: "Shows full bot statistics (users, groups, uptime, etc)",
  commandCategory: "Info",
  usages: "count",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["stats", "botcount"]
};

module.exports.run = async function ({ api, event, global }) {
  try {
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);

    let groupCount = 0;
    let userCount = 0;
    let activeGroups = 0;
    let inactiveGroups = 0;

    for (const thread of allThreads) {
      if (thread.isGroup) {
        groupCount++;
        userCount += thread.participantIDs.length;

        if (thread.messageCount > 50) activeGroups++;
        else inactiveGroups++;
      } else {
        userCount++;
      }
    }

    const currentThread = await api.getThreadInfo(event.threadID);
    const threadName = currentThread.threadName || "This thread";
    const threadMessages = currentThread.messageCount || "unknown";

    // Uptime
    const uptimeMs = Date.now() - global.client.timeStart;
    const totalSec = Math.floor(uptimeMs / 1000);
    const days = Math.floor(totalSec / (3600 * 24));
    const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Memory usage
    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);

    const msg = 
`📊 Bot Statistics
━━━━━━━━━━━━━━
👥 Total Groups: ${groupCount}
🔥 Active Groups: ${activeGroups}
💤 Inactive Groups: ${inactiveGroups}
👤 Total Users: ${userCount}
🗣 ${threadName}: ${threadMessages} messages

⏱ Uptime: ${uptimeStr}
🧠 Memory Used: ${usedMem} MB
💾 Free RAM: ${freeMem} MB / ${totalMem} MB
`;

    return api.sendMessage(msg, event.threadID, event.messageID);

  } catch (err) {
    console.error("[COUNT CMD ERROR]:", err);
    return api.sendMessage("⚠️ Error fetching bot statistics.", event.threadID, event.messageID);
  }
};
