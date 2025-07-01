const axios = require("axios");

module.exports.config = {
  name: "monitor",
  aliases: ["monitor"],
  version: "1.0",
  hasPermssion: 1, // admin only
  credits: "Hassan",
  description: "Manage uptime jobs with cron-job.org",
  commandCategory: "utility",
  usages: "uptime add <url> | uptime list | uptime remove <jobId>",
  cooldowns: 5,
  usePrefix: true
};

const AUTH_TOKEN = "GIU32vWIzI94SdjUpGGhsZAM5+krQJJkSGUrFCNT/HQ=";

module.exports.run = async function ({ api, event, args }) {
  const subcommand = args[0];

  if (!subcommand || !["add", "list", "remove"].includes(subcommand)) {
    return api.sendMessage(
      "📌 Usage:\n- uptime add <url>\n- uptime list\n- uptime remove <jobId>",
      event.threadID,
      event.messageID
    );
  }

  if (subcommand === "add") {
    const url = args[1];
    if (!url) return api.sendMessage("❌ Please provide a URL to monitor.", event.threadID, event.messageID);

    try {
      const payload = {
        job: {
          url,
          enabled: true,
          saveResponses: true,
          schedule: {
            timezone: "Europe/Berlin",
            expiresAt: 0,
            hours: [-1],
            mdays: [-1],
            minutes: [-1],
            months: [-1],
            wdays: [-1]
          }
        }
      };

      const res = await axios.put("https://api.cron-job.org/jobs", payload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_TOKEN}`
        }
      });

      if (res.data?.jobId) {
        return api.sendMessage(
          `✅ Uptime job created for: ${url}\n🆔 Job ID: ${res.data.jobId}`,
          event.threadID,
          event.messageID
        );
      } else {
        return api.sendMessage("⚠️ Could not create the job. Try again later.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error("ADD ERROR:", err.response?.data || err.message);
      return api.sendMessage(
        `❌ Failed to add job:\n${err.response?.data?.message || err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }

  if (subcommand === "list") {
    try {
      const res = await axios.get("https://api.cron-job.org/jobs", {
        headers: {
          "Authorization": `Bearer ${AUTH_TOKEN}`
        }
      });

      const jobs = res.data.jobs;
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return api.sendMessage("📭 No uptime jobs found.", event.threadID, event.messageID);
      }

      const formatted = jobs.map((job, i) =>
        `${i + 1}. ${job.url}\n🆔 Job ID: ${job.jobId}`
      ).join("\n\n");

      return api.sendMessage(`📋 Uptime Jobs:\n\n${formatted}`, event.threadID, event.messageID);
    } catch (err) {
      console.error("LIST ERROR:", err.response?.data || err.message);
      return api.sendMessage(
        `❌ Failed to list jobs:\n${err.response?.data?.message || err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }

  if (subcommand === "remove") {
    const jobId = args[1];
    if (!jobId) return api.sendMessage("❌ Please provide a job ID to remove.", event.threadID, event.messageID);

    try {
      await axios.delete(`https://api.cron-job.org/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${AUTH_TOKEN}`
        }
      });

      return api.sendMessage(`🗑️ Successfully removed job with ID: ${jobId}`, event.threadID, event.messageID);
    } catch (err) {
      console.error("REMOVE ERROR:", err.response?.data || err.message);
      return api.sendMessage(
        `❌ Failed to remove job:\n${err.response?.data?.message || err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
