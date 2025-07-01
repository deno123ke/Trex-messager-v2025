const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "acp",
    aliases: ['accept', 'deny'],
    version: "1.0",
    author: "Hassan",
    countDown: 5,
    role: 2,
    shortDescription: "Manage friend requests",
    longDescription: "Accept or deny friend requests (auto-unsend after 30 seconds)",
    category: "admin",
    guide: {
      en: "{pn} [add|del] [number|all]"
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, listRequest, messageIDsToUnsend } = Reply;

    if (event.senderID !== author)
      return api.sendMessage("⚠️ Only the original admin can use this reply.", event.threadID);

    if (!global.config.ADMINBOT.includes(event.senderID))
      return api.sendMessage("🚫 You don't have permission.", event.threadID);

    const input = event.body.trim().split(/\s+/);
    const action = input[0]?.toLowerCase();
    const targets = input.slice(1);

    if (!['add', 'del'].includes(action))
      return api.sendMessage("⚠️ Invalid action. Use 'add' or 'del'.", event.threadID);

    if (!targets.length)
      return api.sendMessage("⚠️ Provide number(s) or 'all'.", event.threadID);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    if (action === 'add') {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }

    const success = [], failed = [];

    const targetIDs = (targets[0] === 'all')
      ? Array.from({ length: listRequest.length }, (_, i) => i + 1)
      : targets.map(num => parseInt(num)).filter(n => !isNaN(n));

    for (const num of targetIDs) {
      const user = listRequest[num - 1];
      if (!user) {
        failed.push(`❌ Not found: ${num}`);
        continue;
      }

      try {
        form.variables.input.friend_requester_id = user.node.id;
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", {
          ...form,
          variables: JSON.stringify(form.variables)
        });

        if (JSON.parse(res).errors) failed.push(user.node.name);
        else success.push(user.node.name);
      } catch {
        failed.push(user.node.name);
      }
    }

    let msg = `✅ ${action === 'add' ? "Accepted" : "Deleted"} ${success.length}:\n${success.join("\n")}`;
    if (failed.length) msg += `\n\n❌ Failed ${failed.length}:\n${failed.join("\n")}`;

    const result = await api.sendMessage(msg, event.threadID, event.messageID);

    // ⏲️ Auto unsend all after 30 seconds
    setTimeout(async () => {
      try {
        await api.unsendMessage(result.messageID);
        for (const id of messageIDsToUnsend) {
          await api.unsendMessage(id);
        }
      } catch (e) {
        console.error("Unsend error:", e);
      }
    }, 30 * 1000);

    global.api.handleReply.delete(Reply.messageID);
  },

  onStart: async function ({ api, event, commandName }) {
    if (!global.config.ADMINBOT.includes(event.senderID))
      return api.sendMessage("🚫 Admins only.", event.threadID);

    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(res).data?.viewer?.friending_possibilities?.edges || [];

      if (!listRequest.length)
        return api.sendMessage("✅ No pending requests.", event.threadID);

      let msg = "📝 Friend Requests:\n\n";
      listRequest.forEach((user, i) => {
        msg += `${i + 1}. ${user.node.name}\n🆔 ${user.node.id}\n🌐 ${user.node.url.replace("www.facebook", "fb")}\n⏱️ Sent: ${moment(user.time * 1000).format("DD/MM/YYYY HH:mm:ss")}\n\n`;
      });

      msg += "Reply with:\n• add [number|all]\n• del [number|all]";

      const sent = await api.sendMessage(msg, event.threadID);
      const messageIDsToUnsend = [sent.messageID];
      if (event.messageID) messageIDsToUnsend.push(event.messageID);

      global.api.handleReply.set(sent.messageID, {
        name: commandName,
        threadID: event.threadID,
        author: event.senderID,
        messageID: sent.messageID,
        listRequest,
        messageIDsToUnsend
      });

      // ⏲️ Auto unsend after 30 seconds
      setTimeout(async () => {
        try {
          await api.unsendMessage(sent.messageID);
          global.api.handleReply.delete(sent.messageID);
        } catch (e) {
          console.error("Unsend failed:", e);
        }
      }, 30 * 1000);
    } catch (err) {
      console.error("ACP error:", err.message);
      api.sendMessage("❌ Failed to fetch friend requests.", event.threadID);
    }
  }
};
