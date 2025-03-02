require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  socialDataApiKey: process.env.SOCIALDATA_API_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  discordChannelId: process.env.DISCORD_CHANNEL_ID,
  globalWebhookUrl: process.env.GLOBAL_WEBHOOK_URL,
};
