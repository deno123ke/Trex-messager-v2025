const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "shell",
    version: "1.0",
    hasPermssion: 2, // Bot Admins only
    credits: "Hassan",
    description: "Run shell commands or list all .js commands.",
    commandCategory: "Admin",
    usages: "shell <command> | shell list",
    cooldowns: 5,
    usePrefix: true,
    aliases: ["sh", "bash", "terminal"]
  },

  run: async function ({ api, event, args, global }) {
    const { threadID, messageID, senderID } = event;

    if (!global.config.ADMINBOT.includes(senderID)) return;

    const input = args.join(" ").trim();

    if (!input) return api.sendMessage("❗ Usage: shell <command> | shell list", threadID, messageID);

    if (input === "list") {
      const commandDir = __dirname;
      const files = fs.readdirSync(commandDir).filter(file => file.endsWith(".js"));

      const listMessage = files.length
        ? `📁 Commands in this folder:\n\n${files.map(f => `- ${f}`).join("\n")}`
        : "⚠️ No .js commands found.";

      return api.sendMessage(listMessage, threadID, messageID);
    }

    // Block dangerous shell commands
    const blocked = ["rm", "shutdown", "reboot", "mkfs", "dd", ":(){", "init", "poweroff"];
    if (blocked.some(cmd => input.includes(cmd))) {
      return api.sendMessage("🚫 This command is blocked for safety.", threadID, messageID);
    }

    exec(input, { shell: "/bin/bash", maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      let output = "";

      if (error) output += `❌ Error:\n${error.message}\n`;
      if (stderr) output += `⚠️ Stderr:\n${stderr}\n`;
      if (stdout) output += `✅ Output:\n${stdout}\n`;

      output = output.trim() || "⚠️ No output returned.";

      if (output.length < 1900) {
        return api.sendMessage(output, threadID, messageID);
      } else {
        const tempPath = path.join(__dirname, "output.txt");
        fs.writeFileSync(tempPath, output);
        return api.sendMessage({
          body: "📄 Output too long, sent as file:",
          attachment: fs.createReadStream(tempPath)
        }, threadID, () => fs.unlinkSync(tempPath));
      }
    });
  }
};
