export default {
  name: "notification2",
  category: "system",
  usePrefix: true,

  run: async ({ api, event }) => {
    try {
      // Check if the event has a 'logMessageType' (e.g., for join, leave, etc.)
      const logType = event.logMessageType || null;

      if (!logType) {
        return api.sendMessage("ℹ️ No notification data available in this event.", event.threadID);
      }

      let message = "";

      switch (logType) {
        case "log:subscribe":
          const joinerNames = event.logMessageData?.addedParticipants?.map(p => p.fullName).join(", ") || "Someone";
          message = `👋 Welcome ${joinerNames} to the group!`;
          break;

        case "log:unsubscribe":
          const leftName = event.logMessageData?.leftParticipantFullName || "Someone";
          message = `👋 ${leftName} has left the group.`;
          break;

        default:
          message = `📌 Detected notification: ${logType}`;
          break;
      }

      return api.sendMessage(message, event.threadID);
    } catch (err) {
      console.error("[COMMAND_EXEC] notification error:", err);
      return api.sendMessage("❌ An error occurred while running the 'notification' command.", event.threadID);
    }
  }
};
