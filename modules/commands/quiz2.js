const axios = require("axios");
const he = require("he");

// Ensure global.client.quizSessions exists as a Map
global.client.quizSessions = global.client.quizSessions || new Map();

module.exports = {
  config: {
    name: "quiz2",
    version: "1.0",
    author: "Hassan",
    countDown: 10,
    hasPermssion: 0,
    shortDescription: {
      en: "Trivia quiz"
    },
    longDescription: {
      en: "Play a trivia quiz game"
    },
    commandCategory: "game",
    guide: {
      en: "{pn} - Start a quiz"
    }
  },

  onStart: async function ({ api, message, event }) {
    try {
      const { threadID, senderID } = event;

      // Check if a quiz is already running in this chat
      if (global.client.quizSessions.has(threadID)) {
        return message.reply("🚫 A quiz is already running in this chat.");
      }

      // Fetch a trivia question from OpenTDB
      const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
      const data = res.data.results[0];

      // Decode HTML entities in question and answers
      const question = he.decode(data.question);
      const correct = he.decode(data.correct_answer);
      const choices = [...data.incorrect_answers.map(he.decode), correct].sort(() => Math.random() - 0.5);

      // Assign letters (A, B, C, D) to choices
      const letters = ["A", "B", "C", "D"];
      const correctLetter = letters[choices.indexOf(correct)];

      // Format options for display
      const options = choices.map((opt, i) => `${letters[i]}. ${opt}`).join("\n");

      const msg = `🧠 Quiz Time!\n\n${question}\n\n${options}\n\nReply with A, B, C or D.`;

      // Send the quiz message
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) {
          console.error("[quiz2][onStart] Error sending quiz message:", err);
          return message.reply("❌ Failed to send quiz.");
        }

        // Set a timeout for the quiz (e.g., 30 seconds)
        const timeoutId = setTimeout(() => {
          console.log(`[quiz2][onStart] Quiz timeout for thread ${threadID}. Message ID: ${info.messageID}`);
          global.client.quizSessions.delete(threadID);
          api.sendMessage(`⏰ Time's up! The correct answer was: ${correctLetter}. ${correct}`, threadID);
          
          // Remove handleReply entry
          if (global.client.handleReply) {
            global.client.handleReply = global.client.handleReply.filter(
              h => !(h.messageID === info.messageID && h.threadID === threadID)
            );
            console.log(`[QUIZ DEBUG] Removed handleReply entry after timeout`);
          }
        }, 30000);

        // Create the handleReply entry
        const handleReplyEntry = {
          name: this.config.name,
          messageID: info.messageID,
          threadID: threadID,
          author: senderID,
          correctLetter: correctLetter,
          correct: correct
        };
        
        // Initialize if not exists
        if (!global.client.handleReply) {
          global.client.handleReply = [];
          console.log("[QUIZ DEBUG] Initialized global.client.handleReply");
        }
        
        // Add to handleReply array
        global.client.handleReply.push(handleReplyEntry);
        console.log(`[QUIZ DEBUG] Added handleReply entry for message ${info.messageID} in thread ${threadID}`);

        // Store quiz session data
        global.client.quizSessions.set(threadID, {
          correctLetter,
          correct,
          messageID: info.messageID,
          timeoutId
        });
      });
    } catch (err) {
      console.error("[quiz2][onStart] Critical Error starting quiz:", err);
      return message.reply("❌ An error occurred while running the 'quiz2' command. Please try again later.");
    }
  },

  onReply: async function ({ event, message, global, handleReply }) {
    try {
      console.log("[QUIZ DEBUG] onReply triggered");
      console.log(`Event details:`, {
        threadID: event.threadID,
        senderID: event.senderID,
        body: event.body,
        messageReply: event.messageReply ? event.messageReply.messageID : null
      });

      // Safety checks
      if (!global.client.quizSessions) {
        console.error("[QUIZ ERROR] global.client.quizSessions is not defined");
        return message.reply("Quiz system error - please try again later.");
      }

      if (!global.client.handleReply) {
        console.error("[QUIZ ERROR] global.client.handleReply is not defined");
        return message.reply("Quiz system error - please try again later.");
      }

      const { threadID, senderID, body } = event;

      // Check if this is a reply to a message
      if (!event.messageReply || !event.messageReply.messageID) {
        console.log("[QUIZ DEBUG] Not a reply message, ignoring");
        return;
      }

      // Get the quiz session for this thread
      const session = global.client.quizSessions.get(threadID);
      if (!session) {
        console.log(`[QUIZ DEBUG] No active quiz session in thread ${threadID}`);
        return message.reply("❌ No active quiz session found. Start a new quiz first!");
      }

      // Check if the reply is from the original quiz starter
      if (senderID !== handleReply.author) {
        console.log(`[QUIZ DEBUG] Ignoring reply from non-author (${senderID} vs ${handleReply.author})`);
        return;
      }

      // Check if this reply is for our quiz message
      if (event.messageReply.messageID !== session.messageID) {
        console.log(`[QUIZ DEBUG] Reply not for quiz message (${event.messageReply.messageID} vs ${session.messageID})`);
        return;
      }

      // Clear the timeout
      clearTimeout(session.timeoutId);
      global.client.quizSessions.delete(threadID);
      console.log(`[QUIZ DEBUG] Cleared quiz session for thread ${threadID}`);

      // Process the answer
      const userAnswer = body.trim().toUpperCase();
      console.log(`[QUIZ DEBUG] User answered: ${userAnswer}`);

      if (userAnswer === handleReply.correctLetter) {
        await message.reply("🎉 Correct! Well done!");
      } else {
        await message.reply(`❌ Wrong answer. The correct answer was: ${handleReply.correctLetter}. ${handleReply.correct}`);
      }

      // Remove the handleReply entry
      if (global.client.handleReply) {
        global.client.handleReply = global.client.handleReply.filter(
          h => !(h.messageID === session.messageID && h.threadID === threadID)
        );
        console.log(`[QUIZ DEBUG] Removed handleReply entry after answer`);
      }

    } catch (err) {
      console.error("[quiz2][onReply] Critical Error during reply processing:", err);
      return message.reply("❌ An error occurred while checking your answer. Please try a new quiz.");
    }
  }
};
