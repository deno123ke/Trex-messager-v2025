const axios = require("axios");

module.exports = {
  config: {
    name: "quiz",
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Play a trivia quiz",
    longDescription: "Get a trivia question and reply with a/b/c/d to answer",
    category: "game",
    guide: "{pn} - Start a quiz"
  },

  onStart: async function ({ message, event }) {
    try {
      const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986");
      const data = res.data.results[0];

      const question = decodeURIComponent(data.question);
      const correct = decodeURIComponent(data.correct_answer);
      const incorrect = data.incorrect_answers.map(ans => decodeURIComponent(ans));

      const options = [...incorrect, correct].sort(() => Math.random() - 0.5);
      const labels = ["a", "b", "c", "d"];
      const labeledOptions = options.map((opt, i) => `${labels[i]}. ${opt}`).join("\n");
      const correctLetter = labels[options.indexOf(correct)];

      const quizText = `🎯 Trivia Quiz:\n\n❓ ${question}\n\n${labeledOptions}\n\n📝 Reply with a/b/c/d`;

      message.reply(quizText, async (err, info) => {
        if (!err && info?.messageID) {
          global.api.handleReply.set(info.messageID, {
            name: "quiz",
            messageID: info.messageID,
            author: event.senderID,
            correct: correctLetter,
            correctAnswer: correct,
            threadID: event.threadID
          });
        }
      });
    } catch (err) {
      console.error("quiz.js error:", err.message);
      return message.reply("❌ Failed to fetch trivia question.");
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const answer = event.body.trim().toLowerCase();
    const validAnswers = ["a", "b", "c", "d"];

    if (!validAnswers.includes(answer)) {
      return message.reply("⚠️ Please reply with one of the options: a, b, c, or d.");
    }

    if (event.senderID !== Reply.author) {
      return message.reply("🚫 Only the original player can answer this quiz.");
    }

    if (answer === Reply.correct) {
      return message.reply(`✅ Correct! 🎉\nAnswer: ${Reply.correct}. ${Reply.correctAnswer}`);
    } else {
      return message.reply(`❌ Wrong.\nCorrect was: ${Reply.correct}. ${Reply.correctAnswer}`);
    }
  }
};
