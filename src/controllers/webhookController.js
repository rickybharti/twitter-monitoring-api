const logger = require("../utils/logger");
const config = require("../config/config");
const telegramService = require("../services/telegramService");
const discordService = require("../services/discordService");

const processWebhook = async (req, res) => {
  try {
    // Log the entire incoming webhook payload
    logger.info("Received webhook event", { payload: req.body });
    const { event, data, meta } = req.body;
    let message = "";

    if (event === "new_tweet") {
      // Use full_text if available; fallback to data.text
      const tweetText =
        data.full_text || data.text || "No tweet text available.";
      const userScreenName =
        data.user && data.user.screen_name ? data.user.screen_name : "unknown";
      const tweetUrl = `https://twitter.com/${userScreenName}/status/${data.id_str}`;

      message = `🐦 <b>New Tweet from @${userScreenName}</b>\n`;
      message += `<b>Tweet:</b> ${tweetText}\n`;
      message += `<b>Link:</b> <a href="${tweetUrl}">${tweetUrl}</a>\n`;
      message += `<b>Created:</b> ${
        data.tweet_created_at || data.created_at
      }\n`;

      // Add mentions if available
      if (
        data.entities &&
        data.entities.user_mentions &&
        data.entities.user_mentions.length > 0
      ) {
        const mentions = data.entities.user_mentions
          .map((um) => `@${um.screen_name}`)
          .join(", ");
        message += `<b>Mentions:</b> ${mentions}\n`;
      }

      // Add hashtags if available
      if (
        data.entities &&
        data.entities.hashtags &&
        data.entities.hashtags.length > 0
      ) {
        const hashtags = data.entities.hashtags
          .map((tag) => `#${tag.text}`)
          .join(", ");
        message += `<b>Hashtags:</b> ${hashtags}\n`;
      }
    } else if (event === "new_following") {
      // For a new following event, data contains the followed user's details
      const followedUser = data;
      message = `🤝 <b>New Following</b>\n`;
      message += `<b>Name:</b> ${followedUser.name}\n`;
      message += `<b>Twitter:</b> <a href="https://twitter.com/${followedUser.screen_name}">@${followedUser.screen_name}</a>\n`;
      message += `<b>Description:</b> ${
        followedUser.description || "No description"
      }\n`;
      if (followedUser.url) {
        message += `<b>Link:</b> ${followedUser.url}\n`;
      }
      message += `<b>Followers:</b> ${followedUser.followers_count}\n`;
      message += `<b>Following:</b> ${followedUser.friends_count}\n`;
    } else if (event === "profile_update") {
      message = `🔄 <b>Profile Update</b>\n`;
      message += `<b>Name:</b> ${data.name}\n`;
      message += `<b>Bio:</b> ${data.description || "No bio"}\n`;
      message += `<b>Location:</b> ${data.location || "No location"}\n`;
      if (data.url) {
        message += `<b>Website:</b> ${data.url}\n`;
      }
    } else {
      message = `ℹ️ <b>Event "${event}" received.</b>\n`;
    }

    // Append monitor ID for logging
    message += `\n<b>Monitor ID:</b> ${meta.monitor_id}`;

    logger.info("Dispatching notification", { message });

    // Send to Telegram with HTML formatting
    try {
      const tgResponse = await telegramService.sendTelegramMessage(
        config.telegramChatId,
        message,
        { parse_mode: "HTML" }
      );
      logger.info("Telegram message response", { tgResponse });
    } catch (error) {
      logger.error("Error sending Telegram message", {
        error: error.toString(),
      });
    }

    // For Discord, remove HTML tags to send plain text
    try {
      const discordMessage = message.replace(/<[^>]+>/g, "");
      const discordResponse = await discordService.sendDiscordMessage(
        discordMessage
      );
      logger.info("Discord message response", { discordResponse });
    } catch (error) {
      logger.error("Error sending Discord message", {
        error: error.toString(),
      });
    }

    res.status(200).json({ status: "success" });
  } catch (error) {
    logger.error("Webhook processing error", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { processWebhook };
