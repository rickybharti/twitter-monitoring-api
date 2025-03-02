const TelegramBot = require("node-telegram-bot-api");
const config = require("../config/config");
const logger = require("../utils/logger");
const monitorManager = require("./monitorManager");
const socialDataService = require("./socialDataService");

// Create the Telegram bot instance (polling mode)
const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// In-memory conversation state for each chat (keyed by chat id)
const userConversations = {};

// Helper: Format messages (here we simply pass through)
const formatMessage = (text) => text;

// Middleware: Check if the user is allowed to interact with the bot
const isUserAllowed = (username) => {
  return config.allowedTelegramUsers.includes(username);
};

const initTelegramBot = () => {
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    if (!isUserAllowed(username)) {
      bot.sendMessage(
        chatId,
        "🚫 Sorry, you are not authorized to use this bot."
      );
      return;
    }
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
    const username = callbackQuery.from.username;
    if (!isUserAllowed(username)) {
      bot.sendMessage(
        chatId,
        "🚫 Sorry, you are not authorized to use this bot."
      );
      bot.answerCallbackQuery(callbackQuery.id);
      return;
    }
    try {
      if (data === "start_monitor") {
        // Show submenu for specific monitor type selection
        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "User Tweets Monitor",
                  callback_data: "start_monitor_user_tweets",
                },
                {
                  text: "User Following Monitor",
                  callback_data: "start_monitor_user_following",
                },
              ],
              [
                {
                  text: "User Profile Monitor",
                  callback_data: "start_monitor_user_profile",
                },
              ],
            ],
          },
          parse_mode: "HTML",
        };
        await bot.sendMessage(
          chatId,
          "🔎 Choose the type of monitor to start:",
          options
        );
      } else if (
        data === "start_monitor_user_tweets" ||
        data === "start_monitor_user_following" ||
        data === "start_monitor_user_profile"
      ) {
        // Save the selected monitor type and prompt for Twitter handle (without @)
        const monitorType = data.replace("start_monitor_", "");
        userConversations[chatId] = { command: "start_monitor", monitorType };
        await bot.sendMessage(
          chatId,
          "✍️ Please provide the Twitter handle (without @) for monitoring:"
        );
      } else if (data === "stop_monitor") {
        // Now ask for the Twitter handle to stop its monitor
        await bot.sendMessage(
          chatId,
          "🛑 Please provide the Twitter handle (without @) to stop its monitor:"
        );
        userConversations[chatId] = { command: "stop_monitor" };
      } else if (data === "list_monitors") {
        const monitors = await socialDataService.listActiveMonitors();
        let responseMsg = "<b>📃 Active Monitors:</b>\n";
        if (monitors.data && monitors.data.length > 0) {
          monitors.data.forEach((monitor) => {
            const handle =
              monitor.parameters && monitor.parameters.user_screen_name
                ? monitor.parameters.user_screen_name
                : "N/A";
            responseMsg += `• Twitter: <a href="https://twitter.com/${handle}">@${handle}</a> - Type: ${monitor.monitor_type} - Created: ${monitor.created_at}\n`;
          });
        } else {
          responseMsg += "No active monitors found.";
        }
        await bot.sendMessage(chatId, responseMsg, { parse_mode: "HTML" });
      } else if (data === "monitor_details") {
        await bot.sendMessage(
          chatId,
          "🔍 Please provide the Monitor ID to view details:"
        );
        userConversations[chatId] = { command: "monitor_details" };
      } else if (data.startsWith("view_monitor_")) {
        // Extract the twitter handle from the callback data (stored in lowercase)
        const twitterHandle = data.replace("view_monitor_", "");
        const monitors = await socialDataService.listActiveMonitors();
        const monitor = monitors.data.find(
          (m) =>
            m.parameters &&
            m.parameters.user_screen_name &&
            m.parameters.user_screen_name.toLowerCase() === twitterHandle
        );
        if (monitor) {
          let detailsMsg = `🔍 <b>Monitor Details:</b>\n`;
          detailsMsg += `Twitter: <a href="https://twitter.com/${monitor.parameters.user_screen_name}">@${monitor.parameters.user_screen_name}</a>\n`;
          detailsMsg += `Type: ${monitor.monitor_type}\n`;
          detailsMsg += `Created At: ${monitor.created_at}\n`;
          detailsMsg += `Monitor ID: <code>${monitor.id}</code>\n`;
          await bot.sendMessage(chatId, detailsMsg, { parse_mode: "HTML" });
        } else {
          await bot.sendMessage(
            chatId,
            `⚠️ No monitor found for @${twitterHandle}`
          );
        }
      } else if (data.startsWith("delete_monitor_")) {
        // Extract the twitter handle from the callback data (stored in lowercase)
        const twitterHandle = data.replace("delete_monitor_", "");
        const monitors = await socialDataService.listActiveMonitors();
        const monitor = monitors.data.find(
          (m) =>
            m.parameters &&
            m.parameters.user_screen_name &&
            m.parameters.user_screen_name.toLowerCase() === twitterHandle
        );
        if (monitor) {
          await monitorManager.deleteMonitor(monitor.id);
          await bot.sendMessage(
            chatId,
            `✅ Monitor for @${monitor.parameters.user_screen_name} (ID: <code>${monitor.id}</code>) has been deleted.`,
            { parse_mode: "HTML" }
          );
        } else {
          await bot.sendMessage(
            chatId,
            `⚠️ No monitor found for @${twitterHandle}`
          );
        }
      } else if (data === "pump_fun_disabled") {
        await bot.sendMessage(
          chatId,
          "🚫 Pump.fun monitor creation is disabled due to cost restrictions."
        );
      } else {
        await bot.sendMessage(chatId, "❓ Unknown command.");
      }
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
    const username = msg.from.username;
    const text = msg.text;

    // Ensure only allowed users proceed
    if (!isUserAllowed(username)) {
      bot.sendMessage(
        chatId,
        "🚫 Sorry, you are not authorized to use this bot."
      );
      return;
    }

    // If there's an active conversation waiting for input
    if (userConversations[chatId] && !text.startsWith("/")) {
      const { command, monitorType } = userConversations[chatId];
      try {
        if (command === "start_monitor") {
          // Try to create a monitor with the selected type and provided Twitter handle
          try {
            const createResponse = await monitorManager.createMonitor(
              monitorType,
              { user_screen_name: text }
            );
            if (createResponse && createResponse.data) {
              await bot.sendMessage(
                chatId,
                `✅ Monitor created successfully!\nMonitor ID: <code>${createResponse.data.id}</code>`,
                { parse_mode: "HTML" }
              );
            } else {
              await bot.sendMessage(
                chatId,
                "⚠️ Failed to create monitor. Please check the Twitter handle and try again."
              );
            }
          } catch (error) {
            // If the error indicates that a duplicate monitor exists, offer options
            if (
              error.response &&
              error.response.data &&
              error.response.data.message &&
              error.response.data.message.includes("already exists")
            ) {
              await bot.sendMessage(
                chatId,
                `⚠️ A monitor for @${text} already exists. Would you like to view its details or delete it?`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "View Monitor",
                          callback_data: `view_monitor_${text.toLowerCase()}`,
                        },
                        {
                          text: "Delete Monitor",
                          callback_data: `delete_monitor_${text.toLowerCase()}`,
                        },
                      ],
                    ],
                  },
                  parse_mode: "HTML",
                }
              );
            } else {
              await bot.sendMessage(
                chatId,
                `⚠️ Failed to create monitor: ${error.message}`
              );
            }
          }
        } else if (command === "stop_monitor") {
          // Instead of a monitor ID, treat the text as a Twitter handle
          const monitors = await socialDataService.listActiveMonitors();
          const monitor = monitors.data.find(
            (m) =>
              m.parameters &&
              m.parameters.user_screen_name &&
              m.parameters.user_screen_name.toLowerCase() === text.toLowerCase()
          );
          if (monitor) {
            await monitorManager.deleteMonitor(monitor.id);
            await bot.sendMessage(
              chatId,
              `✅ Monitor for @${monitor.parameters.user_screen_name} (ID: <code>${monitor.id}</code>) has been deleted.`,
              { parse_mode: "HTML" }
            );
          } else {
            await bot.sendMessage(chatId, `⚠️ No monitor found for @${text}`);
          }
        } else if (command === "monitor_details") {
          // Fetch details for the given monitor ID and show improved details
          const detailsResponse = await monitorManager.getMonitorDetails(text);
          if (detailsResponse && detailsResponse.data) {
            const details = detailsResponse.data;
            let detailsMsg = `🔍 <b>Monitor Details:</b>\n`;
            if (details.parameters && details.parameters.user_screen_name) {
              detailsMsg += `Twitter: <a href="https://twitter.com/${details.parameters.user_screen_name}">@${details.parameters.user_screen_name}</a>\n`;
            }
            detailsMsg += `Type: ${details.monitor_type}\n`;
            detailsMsg += `Created At: ${details.created_at}\n`;
            detailsMsg += `Monitor ID: <code>${details.id}</code>\n`;
            await bot.sendMessage(chatId, detailsMsg, { parse_mode: "HTML" });
          } else {
            await bot.sendMessage(
              chatId,
              "⚠️ Could not retrieve monitor details. Please check the Monitor ID and try again."
            );
          }
        }
      } catch (error) {
        logger.error("Error processing user input", error);
        await bot.sendMessage(chatId, `⚠️ An error occurred: ${error.message}`);
      }
      delete userConversations[chatId];
    }
  });
};

const sendTelegramMessage = (chatId, message, options = {}) => {
  return bot
    .sendMessage(chatId, formatMessage(message), options)
    .then((response) => {
      logger.info("Telegram sendMessage response", { response });
      return response;
    })
    .catch((error) => {
      logger.error("Telegram sendMessage error", { error: error.toString() });
      throw error;
    });
};

module.exports = {
  initTelegramBot,
  sendTelegramMessage,
  bot,
};
