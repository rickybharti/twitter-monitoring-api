const { Client, GatewayIntentBits } = require("discord.js");
const config = require("../config/config");
const logger = require("../utils/logger");

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

discordClient.once("ready", () => {
  logger.info(`Discord Bot logged in as ${discordClient.user.tag}`);
});

const sendDiscordMessage = async (message) => {
  try {
    const channel = await discordClient.channels.fetch(config.discordChannelId);
    if (channel) {
      await channel.send(message);
      logger.info("Message sent to Discord channel");
    }
  } catch (error) {
    logger.error("Error sending Discord message", error);
  }
};

const initDiscordBot = () => {
  discordClient.login(config.discordBotToken);
};

module.exports = {
  initDiscordBot,
  sendDiscordMessage,
};
