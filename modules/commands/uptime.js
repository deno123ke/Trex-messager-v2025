const os = require("os");

module.exports.config = {
  name: "uptime",
  version: "2.0",
  hasPermssion: 0,
  credits: "Hassan",
  description: "Displays bot uptime, memory usage, and system info.",
  commandCategory: "Info",
  usages: "uptime",
  cooldowns: 5,
  usePrefix: true,
  aliases: ["up", "status"]
};

module.exports.run = async function ({ api, event, global }) {
  try {
    const uptimeMs = Date.now() - global.client.timeStart;
    const totalSec = Math.floor(uptimeMs / 1000);
    const days = Math.floor(totalSec / (3600 * 24));
    const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    let uptimeStr = "";
    if (days) uptimeStr += `${days}d `;
    if (hours || days) uptimeStr += `${hours}h `;
    if (minutes || hours || days) uptimeStr += `${minutes}m `;
    uptimeStr += `${seconds}s`;
    if (totalSec < 1) uptimeStr = "less than 1 second";

    const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const memTotal = process.memoryUsage().heapTotal / 1024 / 1024;

    const totalMem = os.totalmem() / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024;

    const cpuModel = os.cpus()[0].model;
    const nodeVersion = process.version;
    const botVersion = "2.0";

    const message = 
`🤖 Bot Status
━━━━━━━━━━━━━━
⏱️ Uptime: ${uptimeStr}
🧠 Heap: ${memUsed.toFixed(1)} MB / ${memTotal.toFixed(1)} MB
💾 System RAM: ${freeMem.toFixed(1)} MB free / ${totalMem.toFixed(1)} MB total
🖥️ CPU: ${cpuModel}
🧰 Bot Version: v${botVersion}
🛠 Node.js: ${nodeVersion}`;

    return api.sendMessage(message, event.threadID, event.messageID);
  } catch (err) {
    console.error("[UPTIME CMD ERROR]:", err);
    return api.sendMessage("⚠️ An error occurred while checking uptime.", event.threadID, event.messageID);
  }
};
