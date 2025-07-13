const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "persistence",
    version: "2.1",
    author: "Hassan",
    role: 1, // Admin only
    shortDescription: "Manage bot's persistent state",
    longDescription: "Full control over bot's persistent data storage across restarts",
    category: "admin",
    guide: {
      en: "{pn} list - Show all data\n"
        + "{pn} set admin <ID> - Add admin\n"
        + "{pn} remove admin <ID> - Remove admin\n"
        + "{pn} set setting <key> <value> - Add setting\n"
        + "{pn} remove setting <key> - Remove setting\n"
        + "{pn} clear - Reset all data\n"
        + "{pn} backup - Create backup\n"
        + "{pn} restore <file> - Restore from backup"
    }
  },

  onStart: async function({ api, event, args, message }) {
    const HASSAN_UID = "61555393416824"; // 🔒 Replace this with your actual Facebook UID
    if (event.senderID !== HASSAN_UID) {
      return message.reply("🚫 Only Hassan is allowed to use this command.");
    }

    const DATA_DIR = path.join(__dirname, '..', '..', 'data');
    const PERSISTENT_FILE = path.join(DATA_DIR, 'persistent.json');
    const backupDir = path.join(DATA_DIR, 'backups');
    
    fs.ensureDirSync(DATA_DIR);
    fs.ensureDirSync(backupDir);

    const loadData = () => {
      try {
        const defaults = {
          installedCommands: [],
          adminMode: {
            enabled: false,
            adminUserIDs: global.config.ADMINBOT || []
          },
          settings: {
            auto_restart: global.config.autoRestart?.enabled || true,
            lang: global.config.language || "en",
            prefix: global.config.PREFIX || "?"
          }
        };
        
        if (!fs.existsSync(PERSISTENT_FILE)) {
          fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(defaults, null, 2));
          return defaults;
        }
        
        const fileData = JSON.parse(fs.readFileSync(PERSISTENT_FILE, 'utf8'));
        return {
          installedCommands: fileData.installedCommands || defaults.installedCommands,
          adminMode: {
            enabled: fileData.adminMode?.enabled || defaults.adminMode.enabled,
            adminUserIDs: fileData.adminMode?.adminUserIDs || defaults.adminMode.adminUserIDs
          },
          settings: { ...defaults.settings, ...(fileData.settings || {}) }
        };
      } catch (e) {
        console.error("Persistence load error:", e);
        return null;
      }
    };

    const saveData = (data) => {
      try {
        const saveData = {
          installedCommands: Array.isArray(data.installedCommands) ? data.installedCommands : [],
          adminMode: {
            enabled: !!data.adminMode?.enabled,
            adminUserIDs: Array.isArray(data.adminMode?.adminUserIDs) ? data.adminMode.adminUserIDs : []
          },
          settings: data.settings || {}
        };
        
        fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(saveData, null, 2));
        global.installedCommands = saveData.installedCommands;
        global.adminMode = saveData.adminMode;
        return true;
      } catch (e) {
        console.error("Persistence save error:", e);
        return false;
      }
    };

    const createBackup = () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `persistent_${timestamp}.json`);
      fs.copyFileSync(PERSISTENT_FILE, backupFile);
      return backupFile;
    };

    const action = args[0]?.toLowerCase();
    const subAction = args[1]?.toLowerCase();
    const value = args.slice(2).join(" ");

    if (!action) {
      return message.reply(this.config.guide.en);
    }

    const data = loadData();
    if (!data) {
      return message.reply("❌ Failed to load persistent data!");
    }

    switch (action) {
      case 'list':
        const commandList = data.installedCommands.length > 10 
          ? `${data.installedCommands.slice(0, 10).join(', ')}... (+${data.installedCommands.length - 10} more)`
          : data.installedCommands.join(', ') || 'None';
        
        const adminList = data.adminMode.adminUserIDs.length > 5
          ? `${data.adminMode.adminUserIDs.slice(0, 5).join(', ')}... (+${data.adminMode.adminUserIDs.length - 5} more)`
          : data.adminMode.adminUserIDs.join(', ') || 'None';
        
        return message.reply(
          `📊 Persistent Data Status:\n\n` +
          `🛠️ Installed Commands (${data.installedCommands.length}):\n${commandList}\n\n` +
          `👑 Admins (${data.adminMode.adminUserIDs.length}):\n${adminList}\n\n` +
          `🔒 Admin Mode: ${data.adminMode.enabled ? 'ON' : 'OFF'}\n\n` +
          `⚙️ Settings:\n${JSON.stringify(data.settings, null, 2)}`
        );

      case 'set':
        if (!subAction || !value) {
          return message.reply("Missing parameters for 'set' command");
        }

        switch(subAction) {
          case 'admin':
            if (!/^\d+$/.test(value)) {
              return message.reply("Invalid admin ID format. Must be numeric.");
            }
            if (data.adminMode.adminUserIDs.includes(value)) {
              return message.reply(`Admin ${value} already exists.`);
            }
            data.adminMode.adminUserIDs.push(value);
            if (saveData(data)) {
              global.adminMode.adminUserIDs = data.adminMode.adminUserIDs;
              return message.reply(`✅ Added admin ${value}`);
            } else {
              return message.reply("❌ Failed to save changes");
            }

          case 'setting':
            const [key, ...valParts] = value.split(/\s+/);
            const settingValue = valParts.join(' ');
            if (!key || !settingValue) {
              return message.reply("Missing setting key or value");
            }
            data.settings[key] = settingValue;
            if (saveData(data)) {
              return message.reply(`✅ Set ${key} = ${settingValue}`);
            } else {
              return message.reply("❌ Failed to save changes");
            }

          case 'mode':
            if (value === 'on' || value === 'true') {
              data.adminMode.enabled = true;
              if (saveData(data)) {
                global.adminMode.enabled = true;
                return message.reply("✅ Admin-only mode enabled");
              }
            } else if (value === 'off' || value === 'false') {
              data.adminMode.enabled = false;
              if (saveData(data)) {
                global.adminMode.enabled = false;
                return message.reply("✅ Admin-only mode disabled");
              }
            } else {
              return message.reply("Invalid mode value. Use 'on' or 'off'");
            }
            return message.reply("❌ Failed to update mode");

          default:
            return message.reply(`Invalid set type: ${subAction}`);
        }

      case 'remove':
        if (!subAction || !value) {
          return message.reply("Missing parameters for 'remove' command");
        }

        switch(subAction) {
          case 'admin':
            if (!data.adminMode.adminUserIDs.includes(value)) {
              return message.reply(`Admin ${value} not found.`);
            }
            data.adminMode.adminUserIDs = data.adminMode.adminUserIDs.filter(id => id !== value);
            if (saveData(data)) {
              global.adminMode.adminUserIDs = data.adminMode.adminUserIDs;
              return message.reply(`✅ Removed admin ${value}`);
            } else {
              return message.reply("❌ Failed to save changes");
            }

          case 'setting':
            if (!data.settings[value]) {
              return message.reply(`Setting '${value}' not found.`);
            }
            delete data.settings[value];
            if (saveData(data)) {
              return message.reply(`✅ Removed setting '${value}'`);
            } else {
              return message.reply("❌ Failed to save changes");
            }

          default:
            return message.reply(`Invalid remove type: ${subAction}`);
        }

      case 'clear':
        const clearedData = {
          installedCommands: [],
          adminMode: {
            enabled: false,
            adminUserIDs: []
          },
          settings: {}
        };
        if (saveData(clearedData)) {
          global.installedCommands = [];
          global.adminMode = { enabled: false, adminUserIDs: [] };
          return message.reply("✅ All persistent data has been cleared!");
        } else {
          return message.reply("❌ Failed to clear data!");
        }

      case 'backup':
        try {
          const backupFile = createBackup();
          return message.reply(`✅ Backup created:\n${path.basename(backupFile)}`);
        } catch (e) {
          return message.reply(`❌ Backup failed: ${e.message}`);
        }

      case 'restore':
        if (!value) {
          return message.reply("Please specify a backup file to restore");
        }
        
        const backupFile = path.join(backupDir, value);
        if (!fs.existsSync(backupFile)) {
          return message.reply(`Backup file not found: ${value}`);
        }
        
        try {
          const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
          if (saveData(backupData)) {
            global.installedCommands = backupData.installedCommands || [];
            global.adminMode = backupData.adminMode || { enabled: false, adminUserIDs: [] };
            return message.reply(`✅ Successfully restored from ${value}`);
          } else {
            return message.reply("❌ Failed to apply restored data");
          }
        } catch (e) {
          return message.reply(`❌ Restore failed: ${e.message}`);
        }

      default:
        return message.reply(`Invalid action: ${action}\n\n${this.config.guide.en}`);
    }
  },

  onLoad: async function() {
    const DATA_DIR = path.join(__dirname, '..', '..', 'data');
    const PERSISTENT_FILE = path.join(DATA_DIR, 'persistent.json');
    
    if (!fs.existsSync(PERSISTENT_FILE)) {
      fs.ensureDirSync(DATA_DIR);
      fs.writeFileSync(PERSISTENT_FILE, JSON.stringify({
        installedCommands: [],
        adminMode: {
          enabled: false,
          adminUserIDs: global.config.ADMINBOT || []
        },
        settings: {}
      }, null, 2));
    }
  }
};
