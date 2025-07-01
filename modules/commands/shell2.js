const { exec } = require("child_process");

module.exports.config = {
  name: "shell2",
  version: "1.0",
  hasPermssion: 1,
  credits: "Hassan",
  description: "Run terminal commands from Messenger (e.g. install packages)",
  commandCategory: "system",
  usages: "installshell <command>",
  cooldowns: 5,
  usePrefix: true
};

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Only allow your UID
  const allowedUID = "61555393416824";
  if (senderID !== allowedUID) {
    return api.sendMessage("⚠️ You are not allowed to use this command.", threadID, messageID);
  }

  const command = args.join(" ");
  if (!command) return api.sendMessage("❌ Please provide a shell command to run.", threadID, messageID);

  api.sendMessage(`🛠️ Running command: \`${command}\`...`, threadID, async (err, info) => {
    exec(command, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
      if (err) return api.sendMessage("❌ Error:\n" + err.message, threadID, messageID);
      if (stderr) return api.sendMessage("⚠️ Stderr:\n" + stderr, threadID, messageID);
      return api.sendMessage("✅ Output:\n" + stdout.substring(0, 4000), threadID, messageID);
    });
  });
};
