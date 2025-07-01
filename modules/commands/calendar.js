const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports = {
  config: {
    name: "calendar",
    version: "4.0",
    author: "Hassan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Calendar with custom background" },
    longDescription: { en: "Generates a monthly calendar image with a background image from your link" },
    category: "tools",
    guide: { en: "{pn} [month] [year] (optional)" }
  },

  onStart: async function ({ args, message }) {
    const monthInput = parseInt(args[0]);
    const yearInput = parseInt(args[1]);
    const now = new Date();

    const month = (!isNaN(monthInput) && monthInput >= 1 && monthInput <= 12) ? monthInput : now.getMonth() + 1;
    const year = (!isNaN(yearInput) && yearInput >= 1000 && yearInput <= 9999) ? yearInput : now.getFullYear();

    const monthIndex = month - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Canvas setup
    const width = 700;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ✅ Use your custom background image
    const bgUrl = "https://i.ibb.co/r2Wm3m31/511325044-556469524124019-672669905116934679-n-jpg-stp-dst-jpg-s720x720-tt6-nc-cat-110-ccb-1-7-nc-si.jpg";
    try {
      const bgImageBuffer = (await axios.get(bgUrl, { responseType: 'arraybuffer' })).data;
      const bgImage = await loadImage(bgImageBuffer);
      ctx.drawImage(bgImage, 0, 0, width, height);
    } catch (e) {
      ctx.fillStyle = "#ffffff"; // fallback
      ctx.fillRect(0, 0, width, height);
    }

    // Title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${monthNames[monthIndex]} ${year}`, width / 2, 50);

    // Weekdays
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    ctx.font = "20px Arial";
    const cellWidth = width / 7;
    const cellHeight = 50;
    weekdays.forEach((day, i) => {
      ctx.fillStyle = "#000";
      ctx.fillText(day, i * cellWidth + cellWidth / 2, 100);
    });

    // Calendar days
    ctx.font = "18px Arial";
    let day = 1;
    for (let i = 0; i < 42; i++) {
      const x = (i % 7) * cellWidth;
      const y = 130 + Math.floor(i / 7) * cellHeight;

      if (i >= firstDay && day <= daysInMonth) {
        const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

        if (isToday) {
          ctx.fillStyle = "#ffdcdc";
          ctx.beginPath();
          ctx.arc(x + cellWidth / 2, y - 15, 20, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = "#000";
        ctx.fillText(day.toString(), x + cellWidth / 2, y);
        day++;
      }
    }

    // Save and send
    const imgPath = path.join(__dirname, 'calendar_output.png');
    fs.writeFileSync(imgPath, canvas.toBuffer());

    return message.reply({
      body: `📅 Calendar for ${monthNames[monthIndex]} ${year}`,
      attachment: fs.createReadStream(imgPath)
    }, () => fs.unlinkSync(imgPath));
  }
};
