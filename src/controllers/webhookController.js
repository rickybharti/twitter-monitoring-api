const logger = require("../utils/logger");
const config = require("../config/config");
const telegramService = require("../services/telegramService");
const discordService = require("../services/discordService");

const processWebhook = async (req, res) => {
  try {
    const { event, data, meta } = req.body;
    logger.info("Received webhook event", { event, meta });

    let message = "";
    switch (event) {
      case "new_tweet":
        message = `🐦 New Tweet: ${
          data.text || "Tweet content not available."
        }`;
        break;
      case "new_following":
        message = `🤝 New Following: ${data.name} (@${data.screen_name}) followed.`;
        break;
      case "profile_update":
        message = `🔄 Profile Update: ${data.name} updated their profile.`;
        break;
      default:
        message = `ℹ️ Event "${event}" received.`;
        break;
    }

    message += `\nMonitor ID: ${meta.monitor_id}`;

    // Send notifications to Telegram and Discord
    telegramService
      .sendTelegramMessage(config.telegramChatId, message)
      .catch((error) => logger.error("Error sending Telegram message", error));

    discordService
      .sendDiscordMessage(message)
      .catch((error) => logger.error("Error sending Discord message", error));

    res.status(200).json({ status: "success" });
  } catch (error) {
    logger.error("Webhook processing error", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

module.exports = { processWebhook };
