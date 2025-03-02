const TelegramBot = require("node-telegram-bot-api");
const config = require("../config/config");
const logger = require("../utils/logger");
const monitorManager = require("./monitorManager");
const socialDataService = require("./socialDataService");

// Create the Telegram bot instance (polling mode)
const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// In-memory conversation state for each chat (keyed by chat id)
const userConversations = {};

// Helper: Format messages with emojis
const formatMessage = (text) => text;

// Initialize the Telegram Bot and setup inline keyboards/commands
const initTelegramBot = () => {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = formatMessage(
      "👋 Welcome to Twitter Monitor Bot!\nUse the inline buttons below to manage monitors."
    );
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➕ Start Monitor", callback_data: "start_monitor" },
            { text: "🛑 Stop Monitor", callback_data: "stop_monitor" },
          ],
          [
            { text: "📃 List Monitors", callback_data: "list_monitors" },
            { text: "🔍 Monitor Details", callback_data: "monitor_details" },
          ],
          [{ text: "🚫 Pump.fun Monitor", callback_data: "pump_fun_disabled" }],
        ],
      },
    };
    bot.sendMessage(chatId, welcomeMessage, options);
  });

  // Handle inline button callbacks
  bot.on("callback_query", async (callbackQuery) => {
    const { message, data } = callbackQuery;
    const chatId = message.chat.id;
    try {
      switch (data) {
        case "start_monitor":
          // Ask for Twitter handle (without @)
          await bot.sendMessage(
            chatId,
            "✍️ Please provide the Twitter handle (without @) for monitoring:"
          );
          // Set conversation state
          userConversations[chatId] = { command: "start_monitor" };
          break;
        case "stop_monitor":
          await bot.sendMessage(
            chatId,
            "🛑 Please provide the Monitor ID to stop:"
          );
          userConversations[chatId] = { command: "stop_monitor" };
          break;
        case "list_monitors": {
          const monitors = await socialDataService.listActiveMonitors();
          let responseMsg = "📃 *Active Monitors:*\n";
          if (monitors.data && monitors.data.length > 0) {
            monitors.data.forEach((monitor) => {
              responseMsg += `• ${monitor.monitor_type} - ID: \`${monitor.id}\`\n`;
            });
          } else {
            responseMsg += "No active monitors found.";
          }
          await bot.sendMessage(chatId, responseMsg, {
            parse_mode: "Markdown",
          });
          break;
        }
        case "monitor_details":
          await bot.sendMessage(
            chatId,
            "🔍 Please provide the Monitor ID to view details:"
          );
          userConversations[chatId] = { command: "monitor_details" };
          break;
        case "pump_fun_disabled":
          await bot.sendMessage(
            chatId,
            "🚫 Pump.fun monitor creation is disabled due to cost restrictions."
          );
          break;
        default:
          await bot.sendMessage(chatId, "❓ Unknown command.");
          break;
      }
      // Acknowledge the callback
      bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      logger.error("Telegram callback error", error);
      await bot.sendMessage(
        chatId,
        "⚠️ An error occurred while processing your request."
      );
    }
  });

  // Handle text messages for ongoing conversations
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // If there's an active conversation waiting for input
    if (userConversations[chatId] && !text.startsWith("/")) {
      const { command } = userConversations[chatId];
      try {
        switch (command) {
          case "start_monitor":
            // Create a new user tweets monitor using the provided Twitter handle
            const createResponse = await monitorManager.createMonitor(
              "user_tweets",
              { user_screen_name: text }
            );
            if (createResponse && createResponse.data) {
              await bot.sendMessage(
                chatId,
                `✅ Monitor created successfully!\nMonitor ID: \`${createResponse.data.id}\``,
                { parse_mode: "Markdown" }
              );
            } else {
              await bot.sendMessage(
                chatId,
                "⚠️ Failed to create monitor. Please check the Twitter handle and try again."
              );
            }
            break;
          case "stop_monitor":
            // Stop (delete) a monitor using the provided Monitor ID
            await monitorManager.deleteMonitor(text);
            await bot.sendMessage(
              chatId,
              `✅ Monitor \`${text}\` stopped successfully!`,
              { parse_mode: "Markdown" }
            );
            break;
          case "monitor_details":
            // Fetch details for the given monitor ID
            const detailsResponse = await monitorManager.getMonitorDetails(
              text
            );
            if (detailsResponse && detailsResponse.data) {
              const details = detailsResponse.data;
              let detailsMsg = `🔍 *Monitor Details:*\n`;
              detailsMsg += `• Type: ${details.monitor_type}\n`;
              detailsMsg += `• Created At: ${details.created_at}\n`;
              detailsMsg += `• Parameters: \`${JSON.stringify(
                details.parameters
              )}\``;
              await bot.sendMessage(chatId, detailsMsg, {
                parse_mode: "Markdown",
              });
            } else {
              await bot.sendMessage(
                chatId,
                "⚠️ Could not retrieve monitor details. Please check the Monitor ID and try again."
              );
            }
            break;
          default:
            await bot.sendMessage(chatId, "❓ Unknown conversation command.");
            break;
        }
      } catch (error) {
        logger.error("Error processing user input", error);
        await bot.sendMessage(chatId, `⚠️ An error occurred: ${error.message}`);
      }
      // Clear conversation state after handling input
      delete userConversations[chatId];
    }
  });
};

const sendTelegramMessage = (chatId, message, options = {}) => {
  return bot.sendMessage(chatId, formatMessage(message), options);
};

module.exports = {
  initTelegramBot,
  sendTelegramMessage,
  bot,
};
