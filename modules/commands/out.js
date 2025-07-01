const axios = require('axios'); // axios might not be strictly needed for 'out' but is often present
const fs = require('fs-extra'); // fs-extra might not be strictly needed for 'out'
const path = require('path');   // path might not be strictly needed for 'out'

module.exports = {
    config: {
        name: "out",
        version: "1.0",
        author: "Hassan",
        countDown: 5,
        // --- CRUCIAL CHANGE FOR ADMIN-ONLY ---
        // hasPermssion: 1 is typically used for bot administrators in your setup.
        // This ensures only those in global.config.ADMINBOT can use it.
        hasPermssion: 1, // Set to 1 for Bot Admin only
        // ------------------------------------
        shortDescription: {
            en: "kick 🦶 bot from gc by owner bot"
        },
        longDescription: {
            en: "Remove bot from group"
        },
        commandCategory: "owner", // Ensure this matches index.js's expectation (commandCategory)
        guide: {
            en: "just write {pn} (to leave current group) or {pn} <threadID> (to leave specific group)"
        },
        usePrefix: true // Assuming it requires a prefix like other commands
    },

    onStart: async function ({ api, args, message, event }) {
        const { threadID, messageID } = event; // Destructure for convenience

        try {
            // Check if a thread ID is provided as an argument
            const targetThreadID = args[0];

            if (!targetThreadID) {
                // If no thread ID is provided, leave the current thread
                await api.sendMessage("Leaving this group as requested...", threadID, messageID);
                await api.removeUserFromGroup(api.getCurrentUserID(), threadID);
            } else {
                // If a thread ID is provided, validate it and leave that specific thread
                if (isNaN(targetThreadID) || !/^\d+$/.test(targetThreadID)) {
                    // Using the robust ID validation pattern
                    return message.reply("❌ Invalid thread ID provided. Please provide a valid numeric group thread ID.");
                }
                
                await api.sendMessage(`Attempting to leave group with ID: ${targetThreadID}...`, threadID, messageID);
                await api.removeUserFromGroup(api.getCurrentUserID(), targetThreadID);
                // Note: The bot might not be able to send a confirmation message to the *left* group
                // So, send confirmation to the thread where the command was issued.
                api.sendMessage(`✅ Successfully attempted to leave group with ID: ${targetThreadID}.`, threadID, messageID);

            }
        } catch (error) {
            console.error("Error in 'out' command:", error); // Log the full error
            // Send a more informative error message to the user
            message.reply(`❌ An error occurred while trying to leave the group. This could be due to:
- Invalid group ID.
- Bot not being an admin in the target group.
- Facebook API issues.
Please try again later. Error: ${error.message}`);
        }
    }
};
