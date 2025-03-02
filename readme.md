# Twitter Monitoring API

This project uses the SocialData Monitoring API to track Twitter account events (tweets, followings, profile updates, and pump.fun tweets) and distributes notifications to both Telegram and Discord.

## Features

- **SocialData Integration:** Create, update, delete, and list monitors.
- **Webhook Receiver:** An Express endpoint to process events from SocialData.
- **Telegram Bot:** Manage monitors via inline buttons and receive formatted notifications.
- **Discord Bot:** Forward notifications to a designated Discord channel.
- **Error Handling & Logging:** Centralized logging using Winston.
- **Modular & DRY Code:** Each service (SocialData, Telegram, Discord) is separated for easy extension.

## Setup

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file (see sample above) with your configuration.
4. Run `npm start` to launch the server and bots.