const { getTime, drive } = global.utils;

// Initialize global.temp if it doesn't exist
if (!global.temp) {
  global.temp = {};
}
// Initialize welcomeEvent if it doesn't exist
if (!global.temp.welcomeEvent) {
  global.temp.welcomeEvent = {};
}

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "Your Name",
    category: "events",
    description: "Advanced welcome system with customization",
    eventType: "log:subscribe"
  },

  langs: {
    en: {
      session1: "morning",
      session2: "noon",
      session3: "afternoon",
      session4: "evening",
      welcomeMessage: "🤖 Thank you for adding me to the group!\nMy prefix is: %1\nType %1help to see my commands",
      multiple1: "you",
      multiple2: "you all",
      defaultWelcomeMessage: `✨ Welcome {multiple} {userName} to {boxName}!\nEnjoy your {session} with us! 🌟`,
      note: "Customize this message in settings with %1welcome set <message>"
    }
  },

  onStart: async ({ threadsData, message, event, api, getLang }) => {
    try {
      const hours = getTime("HH");
      const { threadID } = event;
      const { nickNameBot } = global.config;
      const prefix = global.config.PREFIX;
      
      const dataAddedParticipants = event.logMessageData.addedParticipants;

      // Bot welcome
      if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
        if (nickNameBot) {
          await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
        }
        return message.send({
          body: getLang("welcomeMessage", prefix),
          mentions: [{
            tag: nickNameBot || global.config.BOTNAME,
            id: api.getCurrentUserID()
          }]
        });
      }

      // Initialize thread welcome data if not exists
      if (!global.temp.welcomeEvent[threadID]) {
        global.temp.welcomeEvent[threadID] = {
          joinTimeout: null,
          dataAddedParticipants: []
        };
      }

      // Add new participants
      global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
      clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

      // Set welcome timeout
      global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
        const threadData = await threadsData.get(threadID);
        
        // Check if welcome is disabled
        if (threadData.settings?.sendWelcomeMessage === false) {
          delete global.temp.welcomeEvent[threadID];
          return;
        }

        const participants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
        const bannedUsers = threadData.data?.banned_ban || [];
        const threadName = threadData.threadName;
        
        const validUsers = participants.filter(user => 
          !bannedUsers.some(banned => banned.id == user.userFbId)
        );

        if (validUsers.length === 0) {
          delete global.temp.welcomeEvent[threadID];
          return;
        }

        // Prepare welcome content
        const { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data || {};
        const multiple = validUsers.length > 1;
        
        const mentions = validUsers.map(user => ({
          tag: user.fullName,
          id: user.userFbId
        }));

        // Process message template
        const processedMessage = welcomeMessage
          .replace(/\{userName\}/g, validUsers.map(u => u.fullName).join(", "))
          .replace(/\{boxName\}/g, threadName)
          .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
          .replace(/\{session\}/g, 
            hours <= 10 ? getLang("session1") :
            hours <= 12 ? getLang("session2") :
            hours <= 18 ? getLang("session3") : getLang("session4")
          );

        // Prepare attachments if exists
        let attachments = [];
        if (threadData.data?.welcomeAttachment) {
          attachments = await Promise.all(
            threadData.data.welcomeAttachment.map(file => 
              drive.getFile(file, "stream").catch(() => null)
            )
          ).then(files => files.filter(Boolean));
        }

        // Send welcome message
        await message.send({
          body: processedMessage,
          mentions,
          attachment: attachments.length > 0 ? attachments : undefined
        });

        delete global.temp.welcomeEvent[threadID];
      }, 1500); // 1.5 second delay
    } catch (err) {
      console.error("Welcome event error:", err);
      if (global.temp.welcomeEvent && global.temp.welcomeEvent[threadID]) {
        delete global.temp.welcomeEvent[threadID];
      }
    }
  },

  onChat: async ({ event, message, args, threadsData, getLang }) => {
    if (args[0]?.toLowerCase() === 'set') {
      if (!global.config.ADMINBOT.includes(event.senderID)) {
        return message.reply("❌ Only admins can set welcome messages");
      }

      const newMessage = args.slice(1).join(" ");
      if (!newMessage) {
        return message.reply(getLang("note"));
      }

      await threadsData.set(event.threadID, {
        data: {
          welcomeMessage: newMessage
        }
      });

      return message.reply("✅ Welcome message set successfully!");
    }
  }
};
