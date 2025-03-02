const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const config = require("./config/config");
const logger = require("./utils/logger");
const webhookRoutes = require("./routes/webhookRoutes");
const telegramService = require("./services/telegramService");
const discordService = require("./services/discordService");

const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Webhook route for receiving SocialData events
app.use("/webhook", webhookRoutes);

// Start the local server
app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

// Initialize Telegram and Discord bots
telegramService.initTelegramBot();
discordService.initDiscordBot();

/**
 * Automatically sets the global webhook URL on startup.
 * This will tell SocialData to send all events to the URL specified
 * in your .env (GLOBAL_WEBHOOK_URL, e.g., your ngrok URL with /webhook).
 */
const setGlobalWebhook = async () => {
  try {
    const response = await axios.post(
      "https://api.socialdata.tools/user/webhook",
      { url: config.globalWebhookUrl },
      {
        headers: {
          Authorization: `Bearer ${config.socialDataApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    logger.info("Global webhook set successfully", { data: response.data });
  } catch (error) {
    logger.error("Error setting global webhook", { error: error.toString() });
  }
};

// Call the function to set the global webhook automatically on startup
setGlobalWebhook();
