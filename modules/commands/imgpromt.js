module.exports = {
  config: {
    name: "imgpromt",
    version: "1.0",
    hasPermssion: 1, // Bot admin only
    credits: "Hassan",
    description: "Sends a detailed AI prompt or instruction",
    commandCategory: "Prompt",
    usages: "hassan prompt1 | prompt2 | start",
    cooldowns: 3,
    usePrefix: true
  },

  run: async function ({ api, event, args, global }) {
    const { threadID, messageID, senderID } = event;

    // Only allow bot admins
    if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage("⛔ You are not authorized to use this command.", threadID, messageID);
    }

    const input = args.join(" ").toLowerCase();

    if (!input || !["prompt1", "prompt2", "start"].includes(input)) {
      return api.sendMessage("⚠️ Use: `hassan prompt1`, `hassan prompt2`, or `hassan start`", threadID, messageID);
    }

    const prompts = {
      prompt1: `Generate a high-resolution image of a young Black man, sepia-toned, in a three-piece dark brown, almost black, suit. He's wearing rectangular, wire-rimmed glasses. His expression is serious and contemplative, his lips subtly puckered into a ZikZak shape, rather than smooth. His crisp white shirt and dark brown tie are visible, as is his waistcoat. The background is blurred and indistinct, suggesting a dimly lit indoor setting. The lighting is soft and focused primarily on his face, creating a subtle chiaroscuro effect. The overall mood is sophisticated, introspective, and slightly melancholic. The style should evoke vintage portrait photography from the mid-20th century. Pay close attention to the textures of the suit fabric and his skin. The image should have a slightly grainy texture to mimic a vintage photograph. His hair is short and neatly groomed. A small portion of his left arm is visible, and he is wearing a dark-colored watch or bracelet on his wrist. The composition is a fairly tight close-up, framing him from the chest up.`,

      prompt2: `Generate an image of a young Black man, sepia-toned, in a three-piece suit. He's wearing rectangular, wire-rimmed glasses. His expression is serious and contemplative, his chin resting on his hand. His hand rests on his face, fingers slightly splayed. The suit is a dark brown, almost black, with a crisp white shirt and a dark brown tie. The waistcoat is clearly visible. The background is blurred and indistinct, suggesting a dimly lit indoor setting. The lighting is soft and focused primarily on the man's face, creating a subtle chiaroscuro effect. The overall mood is sophisticated, introspective, and slightly melancholic. The style should evoke vintage portrait photography from the mid-20th century. Pay close attention to the textures of the suit fabric and the man's skin. The image should have a slightly grainy texture to mimic a vintage photograph. The man's hair is short and neatly groomed. A small portion of his left arm is visible, and he is wearing a dark-colored watch or bracelet on his wrist. The focus should be sharply on the man's face and upper body. The composition should be a fairly tight close-up, framing the man from the chest up. The image should be high resolution and rich in detail. Aim for a similar level of contrast and color saturation seen in the original sepia-toned photo.`,

      start: `Give me a professionally written, highly detailed, and accurate image generation prompt based on this image. The prompt should include every visible detail necessary to recreate the image using an AI image generator. Focus on the subject's appearance, clothing, expression, pose, lighting, background, atmosphere, camera angle, composition, textures, color palette, and artistic style. Write it like a prompt for Midjourney, DALL·E, or Stable Diffusion, using descriptive language that evokes the original image exactly. The final prompt should be ready to copy-paste into an AI image generator to recreate the image as closely as possible.`
    };

    return api.sendMessage(prompts[input], threadID, messageID);
  }
};
