const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "prefix",
        version: "1.0.0",
        author: "Hassan",
        category: "system",
        shortDescription: "View or change the command prefix for this chat",
        longDescription: "Shows the current prefix or allows changing it for this specific chat thread",
        guide: {
            en: "{pn} [new prefix]"
        },
        role: 1, // 1 = thread admin, 2 = bot admin
        countDown: 5,
        usePrefix: true,
        commandCategory: "system"
    },

    onStart: async function ({ api, event, args, threadsData, getLang, message }) {
        try {
            const threadID = event.threadID;
            const currentPrefix = await threadsData.get(threadID, "data.prefix") || global.config.PREFIX;
            
            // If no arguments provided, show current prefix
            if (!args[0]) {
                return message.reply(
                    `🌐 System prefix: ${global.config.PREFIX}\n` +
                    `🛸 Current chat prefix: ${currentPrefix}`
                );
            }

            const newPrefix = args[0];
            
            // Validate new prefix
            if (newPrefix.length > 3) {
                return message.reply("❌ Prefix must be 1-3 characters long");
            }

            // Check permissions
            const threadInfo = await api.getThreadInfo(threadID);
            const isGroup = threadInfo.threadType === 2;
            const isAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
            const isUserAdmin = threadInfo.adminIDs.some(admin => admin.id === event.senderID);
            const isBotAdmin = global.config.ADMINBOT.includes(event.senderID);

            if (!isBotAdmin && (isGroup && (!isAdmin || !isUserAdmin))) {
                return message.reply("🚫 You don't have permission to change the prefix in this chat");
            }

            // Send confirmation message with reaction
            const confirmationMessage = await message.reply(
                `⚠️ Please react to this message to confirm changing prefix to: ${newPrefix}`
            );

            // Store reaction handler
            global.client.onReaction.set(confirmationMessage.messageID, {
                commandName: "prefix_change",
                threadID: threadID,
                author: event.senderID,
                newPrefix: newPrefix
            });
        } catch (error) {
            console.error(error);
            message.reply(`❌ An error occurred: ${error.message}`);
        }
    },

    onReaction: async function ({ api, event, Reaction, threadsData, getLang }) {
        try {
            // Handle prefix change confirmation
            if (Reaction.commandName === "prefix_change") {
                if (event.userID !== Reaction.author) {
                    return api.sendMessage(
                        "❌ Only the command user can confirm prefix change.", 
                        Reaction.threadID
                    );
                }

                // Update thread prefix
                await threadsData.set(Reaction.threadID, Reaction.newPrefix, "data.prefix");
                
                return api.sendMessage(
                    `✅ Prefix changed to: ${Reaction.newPrefix}\n` +
                    `⚙️ System prefix remains: ${global.config.PREFIX}`,
                    Reaction.threadID
                );
            }
        } catch (error) {
            console.error(error);
            api.sendMessage(
                `❌ Failed to change prefix: ${error.message}`,
                Reaction.threadID
            );
        }
    },

    langs: {
        en: {
            prefixGuide: "Use {pn} to see current prefix or {pn} [new prefix] to change it",
            changedSuccess: "Changed prefix to %1"
        }
    }
};
