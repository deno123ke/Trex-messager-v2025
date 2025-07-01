module.exports = {
  config: {
    name: "nguide",
    version: "1.0",
    hasPermssion: 1, // Only bot admins
    credits: "Hassan",
    description: "Provides a Node.js module repair guide",
    commandCategory: "guide",
    usages: "nguide",
    cooldowns: 3,
    usePrefix: true
  },

  run: async function ({ api, event, global }) {
    const { threadID, messageID, senderID } = event;

    // Restrict to bot admins only
    if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage("⛔ You are not authorized to use this command.", threadID, messageID);
    }

    const guide = `
🛠️ FIX GUIDE: Setup/Repair Node Modules

❌ Step 1: Uninstall existing packages
\`\`\`bash
npm uninstall canvas chalk
rm -rf node_modules package-lock.json
\`\`\`

✅ Step 2: Reinstall stable dependencies
\`\`\`bash
npm install chalk@5 fs-extra axios moment-timezone node-cron --legacy-peer-deps
\`\`\`

🔄 Step 3: Downgrade chalk if needed
\`\`\`bash
npm install chalk@4.1.2
\`\`\`

📌 This guide resolves common compatibility errors for bots using Node.js.
    `;

    return api.sendMessage(guide, threadID, messageID);
  }
};
