const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "callad",
    version: "1.4", // Updated version to reflect changes
    author: "Hassan", // Consider adding "Modified by Gemini" if you like!
    countDown: 5,
    role: 0,
    hasPermssion: 0,
    description: {
      en: "Contact bot admins for support"
    },
    category: "support",
    guide: {
      en: "{pn} <message>"
    }
  },

  langs: {
    en: {
      callad: {
        missingMessage: "🔴 Please enter your message to send to admins.",
        noAdmin: "🔴 No admins are currently configured in config.json. Please contact the bot owner.",
        success: "✅ Your message has been sent to {successCount} admin(s).",
        failed: "⚠️ Failed to send to {failedCount} admin(s). Please check console for errors.",
        replyPrefix: "📨 Admin Reply:",
        userPrefix: "👤 User Message:",
        errorOccurred: "🔴 An unexpected error occurred while processing your request. Please try again later.",
        attachmentError: "⚠️ One or more attachments could not be processed and were not sent.",
        replySuccess: "✅ Reply sent successfully.",
        invalidReply: "⚠️ Invalid reply data. Please ensure you are replying directly to an admin message.",
        processingRequest: "⏳ Processing your request...",
        noMessageContent: "🔴 No message content found for reply.",
        adminNotification: "📢 New User Message for Admin Attention!",
        replyInstructions: "💬 Reply to this message to send your response back to the user.",
        continueConversation: "💬 Reply to this message to continue the conversation."
      }
    }
  },

  onStart: async function ({ message, event, args, api, getLang }) {
    try {
      // Show processing message immediately
      await message.reply(getLang("callad", "processingRequest"));

      // Validate input message
      if (!args || args.length === 0) {
        return message.reply(getLang("callad", "missingMessage"));
      }

      // Check admin configuration from global config
      if (!global.config?.ADMINBOT || !Array.isArray(global.config.ADMINBOT) || global.config.ADMINBOT.length === 0) {
        return message.reply(getLang("callad", "noAdmin"));
      }

      // Get sender info
      let senderName = "Unknown User";
      try {
        const senderInfo = await api.getUserInfo(event.senderID);
        senderName = senderInfo[event.senderID]?.name || senderName;
      } catch (e) {
        console.error("[CALLAD ERROR] Error getting user info:", e);
      }

      // Prepare message for admins
      const userMessageContent = args.join(" ");
      const adminMessage = {
        body: `${getLang("callad", "adminNotification")}\n\n` +
              `${getLang("callad", "userPrefix")}\n` +
              `From: ${senderName} (ID: ${event.senderID})\n` +
              `Thread ID: ${event.threadID}\n` + // Added Thread ID for admin's context
              `Message: ${userMessageContent}\n\n` +
              `${getLang("callad", "replyInstructions")}`,
        mentions: [{
          id: event.senderID,
          tag: senderName
        }]
      };

      // Process attachments
      try {
        const attachments = await this.processAttachments(event);
        if (attachments.length > 0) {
          adminMessage.attachment = attachments;
        }
      } catch (e) {
        console.error("[CALLAD ERROR] Attachment processing failed:", e);
        adminMessage.body += `\n\n${getLang("callad", "attachmentError")}`;
      }

      // Send to admins
      const results = await this.sendToAdmins(api, adminMessage, event);
      
      // Prepare and send final response to user
      let response = "";
      if (results.successCount > 0) {
        response += getLang("callad", "success", { successCount: results.successCount });
      }
      if (results.failedCount > 0) {
        response += (results.successCount > 0 ? "\n" : "") + getLang("callad", "failed", { failedCount: results.failedCount });
      }

      return message.reply(response || getLang("callad", "errorOccurred"));

    } catch (err) {
      console.error("CALLAD ERROR in onStart (main execution):", err);
      return message.reply(getLang("callad", "errorOccurred"));
    }
  },

  onReply: async ({ message, event, Reply, api, args, getLang }) => {
    try {
      const { type, threadID, messageIDSender, senderID } = Reply;
      
      // Validate reply data
      if (!type || !threadID || !messageIDSender || !senderID) {
        return message.reply(getLang("callad", "invalidReply"));
      }

      // Get sender info (who is replying: admin or user)
      let senderName = type === "adminReply" ? "Admin" : "User";
      try {
        const info = await api.getUserInfo(event.senderID);
        senderName = info[event.senderID]?.name || senderName;
      } catch (e) {
        console.error("[CALLAD ERROR] Error getting user info in onReply:", e);
      }

      // Validate message content for the reply
      if (!args || args.length === 0) {
        return message.reply(getLang("callad", "noMessageContent"));
      }

      // Prepare reply message
      const replyMessageContent = args.join(" ");
      const replyMessage = {
        body: `${type === "adminReply" ? getLang("callad", "replyPrefix") : getLang("callad", "userPrefix")}\n\n` +
              `From: ${senderName}\n` +
              `Message: ${replyMessageContent}\n\n` +
              `${getLang("callad", "continueConversation")}`,
        mentions: [{
          id: event.senderID,
          tag: senderName
        }]
      };

      // Process attachments for the reply
      try {
        const attachments = await module.exports.processAttachments(event); // Use module.exports to call processAttachments
        if (attachments.length > 0) {
          replyMessage.attachment = attachments;
        }
      } catch (e) {
        console.error("[CALLAD ERROR] Attachment processing failed in onReply:", e);
        replyMessage.body += `\n\n${getLang("callad", "attachmentError")}`;
      }

      // Determine recipient (send back to original user or admin) and send
      const recipientID = type === "adminReply" ? senderID : threadID; // If admin replied, send to original user's ID; else send to original thread ID
      const targetMessageID = messageIDSender; // The message ID to which this reply is tied

      const sentMsg = await api.sendMessage(replyMessage, recipientID, (err) => {
        if (err) {
          console.error(`[CALLAD ERROR] Failed to send reply to ${recipientID}:`, err);
          return message.reply(getLang("callad", "errorOccurred"));
        }
        // Set up next reply handler only if message was successfully sent
        const nextType = type === "adminReply" ? "userReply" : "adminReply";
        global.client.handleReply.set(sentMsg.messageID, {
          name: module.exports.config.name,
          threadID: type === "adminReply" ? threadID : event.threadID, // If admin replied, original thread was admin's. If user replied, original thread was user's.
          messageIDSender: event.messageID, // The message ID of the current reply
          type: nextType,
          senderID: type === "adminReply" ? senderID : event.senderID // Original sender for next reply handler
        });
      });

      return message.reply(getLang("callad", "replySuccess"));

    } catch (err) {
      console.error("CALLAD REPLY ERROR in onReply (main execution):", err);
      return message.reply(getLang("callad", "errorOccurred"));
    }
  },

  sendToAdmins: async function(api, message, originalEvent) {
    const results = { successCount: 0, failedCount: 0 };
    console.log(`[CALLAD DEBUG] Attempting to send message to admins.`);
    console.log(`[CALLAD DEBUG] Configured ADMINBOT IDs: ${JSON.stringify(global.config.ADMINBOT)}`);

    if (!global.config.ADMINBOT || !Array.isArray(global.config.ADMINBOT) || global.config.ADMINBOT.length === 0) {
      console.log(`[CALLAD DEBUG] No ADMINBOT IDs found in config. Returning.`);
      return results;
    }

    for (const adminID of global.config.ADMINBOT) {
      console.log(`[CALLAD DEBUG] Attempting to send message to admin ID: ${adminID}`);
      try {
        // Adding a small delay for each message to admins to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500)); // Increased to 1.5-second delay for robustness

        const sentMsg = await api.sendMessage(message, adminID);
        console.log(`[CALLAD DEBUG] Message sent successfully to ${adminID}. Message ID: ${sentMsg.messageID}`);
        
        global.client.handleReply.set(sentMsg.messageID, {
          name: this.config.name,
          threadID: originalEvent.threadID, // Original thread where user initiated callad
          messageIDSender: originalEvent.messageID, // Original message ID from user
          type: "adminReply", // This reply handler is for the admin to reply to the user
          senderID: originalEvent.senderID // The user who sent the callad message
        });
        
        results.successCount++;
      } catch (err) {
        console.error(`[CALLAD ERROR] Failed to send message to admin ${adminID}:`, err);
        // Detailed error logging
        if (err.error === 'The user must login to continue.') {
            console.error(`[CALLAD ERROR] Admin ${adminID} might not be accessible or bot session expired. Please check bot's appstate.json and permissions.`);
        } else if (err.error_user_title || err.error_user_msg) {
              console.error(`[CALLAD ERROR] Facebook User Error for ${adminID}: Title - "${err.error_user_title || 'N/A'}", Message - "${err.error_user_msg || 'N/A'}"`);
        } else if (err.error === 'GraphMethodException' && err.statusCode === 400) {
              console.error(`[CALLAD ERROR] Graph API Error (400 Bad Request) for ${adminID}. This often means the recipient cannot be messaged by the bot (e.g., not friends, privacy settings).`);
        } else if (err.error === 'A security check is required to continue.') {
              console.error(`[CALLAD ERROR] A security check is required for admin ${adminID}. Bot's account might be locked or require verification.`);
        } else if (err.error && err.error.includes("This person isn't available right now.")) {
              console.error(`[CALLAD ERROR] Admin ${adminID} is currently unavailable for messaging (e.g., blocked the bot, deactivated account).`);
        } else {
              console.error(`[CALLAD ERROR] Unknown error details for ${adminID}:`, err.message || JSON.stringify(err));
        }
        results.failedCount++;
      }
    }
    console.log(`[CALLAD DEBUG] Finished sending to admins. Success: ${results.successCount}, Failed: ${results.failedCount}`);
    return results;
  },

  processAttachments: async function(event) {
    const attachments = [];
    const mediaTypes = ["photo", "video", "audio", "animated_image"];
    
    if (!event.attachments || !Array.isArray(event.attachments)) {
      return attachments;
    }

    const tempDir = path.join(__dirname, 'temp_callad_attachments'); // Specific temp directory for callad
    await fs.ensureDir(tempDir);

    for (const attachment of event.attachments) {
      if (!mediaTypes.includes(attachment.type)) continue;

      const tempPath = path.join(tempDir, `${Date.now()}_${attachment.filename || attachment.id}`); // Use filename or ID
      try {
        const response = await axios({
          url: attachment.url,
          method: 'GET',
          responseType: 'stream',
          timeout: 10000 // 10 seconds timeout for download
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        attachments.push(fs.createReadStream(tempPath));

        // Clean up after 10 minutes (increased from 5 to ensure file is read before deletion)
        setTimeout(() => {
          fs.unlink(tempPath)
            .then(() => console.log(`[CALLAD DEBUG] Cleaned up temporary attachment: ${tempPath}`))
            .catch(e => console.error(`[CALLAD ERROR] Failed to clean up attachment ${tempPath}:`, e));
        }, 600000); // 10 minutes

      } catch (err) {
        console.error(`[CALLAD ATTACHMENT ERROR] Error processing attachment ${attachment.id} (URL: ${attachment.url}):`, err);
        // Do not re-throw, just log and continue to next attachment
      }
    }

    return attachments;
  }
};
