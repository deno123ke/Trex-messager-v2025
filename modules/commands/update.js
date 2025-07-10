module.exports = {
  config: {
    name: "update",
    version: "1.0.0",
    author: "Hassan",
    role: 2,
    shortDescription: "Update the bot system",
    longDescription: "Check for and install updates for the bot system and dependencies",
    category: "system",
    guide: {
      en: "{pn} [check|install|force]"
    },
    usePrefix: true
  },

  onStart: async function({ api, event, args, message }) {
    try {
      const action = args[0]?.toLowerCase() || 'check';
      
      switch (action) {
        case 'check':
          await checkUpdates(api, event, message);
          break;
          
        case 'install':
          await installUpdates(api, event, message);
          break;
          
        case 'force':
          await forceUpdate(api, event, message);
          break;
          
        default:
          await message.reply(`Invalid action. Usage:\n${this.config.guide.en.replace('{pn}', global.config.PREFIX + this.config.name)}`);
          break;
      }
    } catch (error) {
      console.error(error);
      await message.reply(`❌ An error occurred: ${error.message}`);
    }
  }
};

async function checkUpdates(api, event, message) {
  const { execSync } = require('child_process');
  const semver = require('semver');
  const axios = require('axios');
  const path = require('path');
  
  try {
    await message.reply("🔍 Checking for updates...");
    
    const localConfig = global.config;
    const repoConfigUrl = "https://raw.githubusercontent.com/Horror-king/S-pTrex-v2025/main/config.json";
    const { data: remoteConfig } = await axios.get(repoConfigUrl);
    
    let updateMessage = `📦 Current version: ${localConfig.version}\n`;
    
    if (semver.gt(remoteConfig.version, localConfig.version)) {
      updateMessage += `🆕 New version available: ${remoteConfig.version}\n`;
      updateMessage += `📝 Changelog:\n${remoteConfig.changelog || 'No changelog provided'}\n\n`;
      updateMessage += `Use "${global.config.PREFIX}update install" to update`;
    } else {
      updateMessage += "✅ Your bot is up to date!";
    }
    
    if (global.config.UPDATE?.Package) {
      updateMessage += "\n\n🔍 Checking npm packages...\n";
      const outdatedPackages = JSON.parse(execSync('npm outdated --json --long', { encoding: 'utf8' }));
      
      if (Object.keys(outdatedPackages).length > 0) {
        updateMessage += "📦 Outdated packages:\n";
        for (const [pkg, info] of Object.entries(outdatedPackages)) {
          if (global.config.UPDATE.EXCLUDED.includes(pkg)) {
            updateMessage += `⚠️ ${pkg} (${info.current} → ${info.latest}) [EXCLUDED]\n`;
          } else {
            updateMessage += `🔴 ${pkg} (${info.current} → ${info.latest})\n`;
          }
        }
        updateMessage += `\nUse "${global.config.PREFIX}update install" to update`;
      } else {
        updateMessage += "✅ All packages are up to date!";
      }
    }
    
    await message.reply(updateMessage);
  } catch (error) {
    throw new Error(`Failed to check updates: ${error.message}`);
  }
}

async function installUpdates(api, event, message) {
  const { exec } = require('child_process');
  const fs = require('fs-extra');
  const axios = require('axios');
  const semver = require('semver');
  const path = require('path');
  
  try {
    await message.reply("🔄 Starting system update...");
    
    const configBackup = global.config;
    await fs.writeFileSync(
      path.join(global.client.mainPath, 'config_backup.json'),
      JSON.stringify(configBackup, null, 2)
    );
    
    const repoConfigUrl = "https://raw.githubusercontent.com/Horror-king/S-pTrex-v2025/main/config.json";
    const { data: latestConfig } = await axios.get(repoConfigUrl);
    
    if (!semver.gt(latestConfig.version, configBackup.version)) {
      return await message.reply("ℹ️ No new version available. Use 'force' to reinstall anyway.");
    }
    
    const preservedSettings = {
      email: configBackup.email,
      password: configBackup.password,
      useEnvForCredentials: configBackup.useEnvForCredentials,
      ADMINBOT: configBackup.ADMINBOT,
      PREFIX: configBackup.PREFIX,
      BOTNAME: configBackup.BOTNAME,
      APPSTATEPATH: configBackup.APPSTATEPATH
    };
    
    const mergedConfig = {
      ...latestConfig,
      ...preservedSettings,
      version: latestConfig.version
    };
    
    await fs.writeFileSync(
      path.join(global.client.mainPath, 'config.json'),
      JSON.stringify(mergedConfig, null, 2)
    );
    
    if (global.config.UPDATE?.Package) {
      await message.reply("📦 Updating npm packages...");
      
      await new Promise((resolve, reject) => {
        exec('npm install', (error, stdout, stderr) => {
          if (error) {
            console.error(stderr);
            reject(new Error('Package update failed'));
          } else {
            resolve();
          }
        });
      });
    }
    
    await message.reply(
      `✅ Update completed successfully to v${mergedConfig.version}!\n` +
      `The bot will now restart to apply changes...`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await global.utils.restartBot(api, "Update completed");
    
  } catch (error) {
    try {
      const backup = JSON.parse(
        fs.readFileSync(path.join(global.client.mainPath, 'config_backup.json'), 'utf8')
      );
      await fs.writeFileSync(
        path.join(global.client.mainPath, 'config.json'),
        JSON.stringify(backup, null, 2)
      );
      await message.reply("🔄 Restored from backup due to update failure.");
    } catch (restoreError) {
      await message.reply(`❌ Update failed AND backup restore failed! Manual intervention required.\nError: ${error.message}`);
      throw error;
    }
    
    throw new Error(`Update failed: ${error.message}`);
  }
}

async function forceUpdate(api, event, message) {
  const { exec } = require('child_process');
  const fs = require('fs-extra');
  const axios = require('axios');
  const path = require('path');
  
  try {
    await message.reply("⚠️ Starting FORCED update...");
    
    const configBackup = global.config;
    await fs.writeFileSync(
      path.join(global.client.mainPath, 'config_backup.json'),
      JSON.stringify(configBackup, null, 2)
    );
    
    const repoConfigUrl = "https://raw.githubusercontent.com/Horror-king/S-pTrex-v2025/main/config.json";
    const { data: latestConfig } = await axios.get(repoConfigUrl);
    
    const preservedSettings = {
      email: configBackup.email,
      password: configBackup.password,
      useEnvForCredentials: configBackup.useEnvForCredentials,
      ADMINBOT: configBackup.ADMINBOT,
      PREFIX: configBackup.PREFIX,
      BOTNAME: configBackup.BOTNAME,
      APPSTATEPATH: configBackup.APPSTATEPATH
    };
    
    const mergedConfig = {
      ...latestConfig,
      ...preservedSettings,
      version: latestConfig.version
    };
    
    await fs.writeFileSync(
      path.join(global.client.mainPath, 'config.json'),
      JSON.stringify(mergedConfig, null, 2)
    );
    
    await message.reply("📦 Force updating ALL npm packages...");
    
    await new Promise((resolve, reject) => {
      exec('npm install --force', (error, stdout, stderr) => {
        if (error) {
          console.error(stderr);
          reject(new Error('Force update failed'));
        } else {
          resolve();
        }
      });
    });
    
    await message.reply(
      `✅ FORCED update completed to v${mergedConfig.version}!\n` +
      `The bot will now restart to apply changes...`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await global.utils.restartBot(api, "Forced update completed");
    
  } catch (error) {
    try {
      const backup = JSON.parse(
        fs.readFileSync(path.join(global.client.mainPath, 'config_backup.json'), 'utf8')
      );
      await fs.writeFileSync(
        path.join(global.client.mainPath, 'config.json'),
        JSON.stringify(backup, null, 2)
      );
      await message.reply("🔄 Restored from backup due to forced update failure.");
    } catch (restoreError) {
      await message.reply(`❌ FORCED update failed AND backup restore failed! Manual intervention required.\nError: ${error.message}`);
      throw error;
    }
    
    throw new Error(`Force update failed: ${error.message}`);
  }
}
