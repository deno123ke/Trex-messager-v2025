module.exports = {
  config: {
    name: "quiz0",
    version: "1.2",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: "Quiz game with multiple choice",
    longDescription: "Start a quiz game and wait for user reply",
    category: "games",
    guide: "{pn}"
  },

  onStart: async function({ event, message }) {
    // Quiz questions with all text hardcoded
    const quizzes = [
      {
        question: "Quiz Time!\n\nIn the Super Mario Bros. Movie (2023), who plays Toad?\n\nA. Keegan-Michael Key\nB. Seth Rogan\nC. Charlie Day\nD. Jack Black",
        answer: "A",
        answerText: "Keegan-Michael Key",
        replyPrompt: "Reply with A, B, C, or D"
      },
      {
        question: "Quiz Time!\n\nWhat is the capital of France?\n\nA. London\nB. Paris\nC. Berlin\nD. Madrid",
        answer: "B",
        answerText: "Paris",
        replyPrompt: "Reply with A, B, C, or D"
      }
    ];

    // Select random quiz
    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];

    // Send the quiz question
    const sentMessage = await message.reply(`${quiz.question}\n\n${quiz.replyPrompt}`);

    // Store quiz data
    global.client.quizSessions = global.client.quizSessions || {};
    global.client.quizSessions[event.threadID] = {
      answer: quiz.answer,
      answerText: quiz.answerText,
      messageID: sentMessage.messageID,
      timeout: setTimeout(() => {
        message.reply(`⏰ Time's up! The correct answer was ${quiz.answerText}.`);
        delete global.client.quizSessions[event.threadID];
      }, 30000)
    };
  },

  onReply: async function({ event, message }) {
    if (!global.client.quizSessions?.[event.threadID]) return;
    if (event.messageReply.messageID !== global.client.quizSessions[event.threadID].messageID) return;

    // Clear timeout
    clearTimeout(global.client.quizSessions[event.threadID].timeout);

    // Get user answer
    const userAnswer = event.body.trim().toUpperCase().charAt(0);
    const correctAnswer = global.client.quizSessions[event.threadID].answer;
    const answerText = global.client.quizSessions[event.threadID].answerText;

    // Check answer
    if (userAnswer === correctAnswer) {
      await message.reply(`✅ Correct! The answer was ${answerText}.`);
    } else {
      await message.reply(`❌ Wrong! The correct answer was ${answerText}.`);
    }

    // Clean up
    delete global.client.quizSessions[event.threadID];
  }
};
