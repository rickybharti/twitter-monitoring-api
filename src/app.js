const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config/config");
const logger = require("./utils/logger");
const webhookRoutes = require("./routes/webhookRoutes");
const telegramService = require("./services/telegramService");
const discordService = require("./services/discordService");

const app = express();

// Middlewares
app.use(bodyParser.json());

// Routes
app.use("/webhook", webhookRoutes);

// Start server
app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

// Initialize bots
telegramService.initTelegramBot();
discordService.initDiscordBot();
