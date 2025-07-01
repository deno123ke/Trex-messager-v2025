module.exports.config = {
  name: "help",
  commandCategory: "utility",
  usePrefix: true,
  version: "1.0.9",
  credits: "Hassan",
  description: "Shows all available commands or help for one",
  hasPermssion: 0,
  cooldowns: 5,
  aliases: ["h", "cmds", "commands"]
};

module.exports.run = async function ({ api, event, args, global }) {
  try {
    const prefix = global.config.PREFIX || "!";
    const commands = global.client.commands;
    const disabled = global.config.commandDisabled || [];

    if (!commands || typeof commands !== "object") {
      return api.sendMessage("⚠️ Commands list is not available.", event.threadID, event.messageID);
    }

    const enabledCommands = [];

    for (const [name, cmd] of commands.entries()) {
      const config = cmd.config || {};
      if (!disabled.includes(`${config.name || name}.js`)) {
        enabledCommands.push(cmd);
      }
    }

    if (args.length > 0) {
      const name = args[0].toLowerCase();
      const foundCommand = enabledCommands.find(cmd => {
        const c = cmd.config || {};
        const aliases = Array.isArray(c.aliases) ? c.aliases.map(a => a.toLowerCase()) : [];
        return (c.name?.toLowerCase() === name || aliases.includes(name));
      });

      if (!foundCommand) {
        return api.sendMessage(`❌ Command "${name}" not found. Use "${prefix}help" to see available commands.`, event.threadID, event.messageID);
      }

      const c = foundCommand.config || {};
      const roleMap = { 0: "Member", 1: "Admin", 2: "Bot Admin" };
      const usage = typeof c.usage === "string" ? c.usage : "";

      const infoMsg =
        `≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋\n` +
        `🔍 Command: ${c.name || "Unknown"}\n` +
        `📂 Category: ${c.commandCategory || "Uncategorized"}\n` +
        `📝 Description: ${c.description || "No description"}\n` +
        `⏱️ Cooldown: ${c.cooldowns || 0}s\n` +
        `🛠️ Usage: ${c.usePrefix === false ? "" : prefix}${c.name} ${usage}\n` +
        `🏷️ Aliases: ${Array.isArray(c.aliases) ? c.aliases.join(", ") : "None"}\n` +
        `🧑‍💼 Role Required: ${roleMap[c.hasPermssion] || c.hasPermssion || "0"}\n` +
        `👤 Author: ${c.credits || c.author || "Unknown"}\n` +
        `≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`;

      return api.sendMessage(infoMsg, event.threadID, event.messageID);
    }

    const categories = {};
    for (const cmd of enabledCommands) {
      const c = cmd.config || {};
      const cat = c.commandCategory?.toLowerCase() || "uncategorized";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c.name || "unknown");
    }

    const formatCategory = (cmds, perLine = 3) => {
      cmds.sort();
      const lines = [];
      for (let i = 0; i < cmds.length; i += perLine) {
        const row = cmds.slice(i, i + perLine).map(cmd => cmd.padEnd(12)).join("| ");
        lines.push("• " + row.trim());
      }
      return lines.join("\n");
    };

    let helpMsg = `SuNita ToTal ComMands: ${enabledCommands.length}\n`;
    helpMsg += `≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋\n\n`;

    for (const cat of Object.keys(categories).sort()) {
      helpMsg += `📂 ${cat}:\n${formatCategory(categories[cat])}\n\n`;
    }

    helpMsg += `ℹ️ use "${prefix}help [command]" for more info\n`;
    helpMsg += `🤖 bot by hassan\n`;
    helpMsg += `≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋≋`;

    return api.sendMessage(helpMsg.trim(), event.threadID, event.messageID);

  } catch (err) {
    console.error("❌ HELP COMMAND ERROR:", err);
    return api.sendMessage("⚠️ An error occurred while running help.", event.threadID, event.messageID);
  }
};
