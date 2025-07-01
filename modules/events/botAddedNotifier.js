// modules/events/botAddedNotifier.js

module.exports = {
    config: {
        name: "botAddedNotifier",
        version: "1.0",
        author: "Hassan",
        description: "Notifies bot admins when the bot is added to a new group.",
        eventType: ["event"], // This module listens for general 'event' type messages
        hasPermssion: 0, // No specific user permission needed for this event to run
        // No usePrefix here as it's an event handler, not a command
    },

    // onChat is the main handler for general API events in this framework
    onChat: async function({ api, event, global }) {
        // Check if the event type is 'log:subscribe' (which indicates someone was added to a thread)
        // And if the added user is the bot itself.
        if (event.logMessageType === "log:subscribe" && event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
            const { threadID } = event;
            const adderUserID = event.author; // The user who performed the action (added someone)

            let threadInfo;
            try {
                // Get information about the group the bot was added to
                threadInfo = await api.getThreadInfo(threadID);
            } catch (err) {
                console.error("Error getting thread info in botAddedNotifier:", err);
                // Fallback if thread info can't be fetched
                threadInfo = {
                    threadName: "Unknown Group Name",
                    participantIDs: []
                };
            }

            let adderUserInfo;
            try {
                // Get information about the user who added the bot
                const userInfo = await api.getUserInfo(adderUserID);
                adderUserInfo = userInfo[adderUserID].name;
            } catch (err) {
                console.error("Error getting adder user info in botAddedNotifier:", err);
                adderUserInfo = "Unknown User";
            }

            const notificationMessage = `🤖 **Bot Added to New Group!**
------------------------------
**Group Name:** ${threadInfo.threadName}
**Group ID:** ${threadID}
**Added By:** ${adderUserInfo} (User ID: ${adderUserID})
------------------------------`;

            // Send notification to all configured ADMINBOTs
            // global.config.ADMINBOT is populated dynamically from config.json
            if (global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
                for (const adminID of global.config.ADMINBOT) {
                    try {
                        await global.utils.humanDelay(); // Add a small delay for rate limiting
                        await api.sendMessage(notificationMessage, adminID);
                        console.log(`Sent bot added notification to admin: ${adminID}`);
                    } catch (e) {
                        console.error(`Failed to send bot added notification to admin ${adminID}:`, e);
                    }
                }
            } else {
                console.warn("No ADMINBOTs configured in config.json to send bot added notifications.");
            }
        }
    }
};
