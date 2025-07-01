module.exports = {
  config: {
    name: "botteam",
    version: "1.0",
    author: "Hassan^John",
    countDown: 5,
    role: 0,
    shortDescription: "Information about Hassan John, the Node.js bot developer.",
    longDescription: "Displays information about Hassan John, the developer of this Node.js bot.",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    const teamInfo = `
🤖 Bot Developer Information 🤖

This Node.js bot was created and is maintained by:

👨‍💻 Hassan John

I'm a Node.js developer passionate about creating helpful and engaging bots.

If you have any questions, suggestions, or feedback, feel free to reach out!

📧 Email: botmesenger2@gmail.com 
💬 Discord: HassanJohn#1234 
`;

    message.reply(teamInfo);
  }
};
