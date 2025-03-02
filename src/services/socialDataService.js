const axios = require("axios");
const config = require("../config/config");
const logger = require("../utils/logger");

const apiClient = axios.create({
  baseURL: "https://api.socialdata.tools",
  headers: {
    Authorization: `Bearer ${config.socialDataApiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

module.exports = {
  setGlobalWebhook: async (url) => {
    try {
      const response = await apiClient.post("/user/webhook", { url });
      logger.info("Global webhook URL updated", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error setting global webhook", error);
      throw error;
    }
  },

  createUserTweetsMonitor: async ({
    user_id,
    user_screen_name,
    webhook_url,
  }) => {
    try {
      const payload = { user_id, user_screen_name };
      if (webhook_url) payload.webhook_url = webhook_url;
      const response = await apiClient.post("/monitors/user-tweets", payload);
      logger.info("User Tweets Monitor created", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error creating user tweets monitor", error);
      throw error;
    }
  },

  createUserFollowingMonitor: async ({
    user_id,
    user_screen_name,
    webhook_url,
  }) => {
    try {
      const payload = { user_id, user_screen_name };
      if (webhook_url) payload.webhook_url = webhook_url;
      const response = await apiClient.post(
        "/monitors/user-following",
        payload
      );
      logger.info("User Following Monitor created", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error creating user following monitor", error);
      throw error;
    }
  },

  createUserProfileMonitor: async ({
    user_id,
    user_screen_name,
    webhook_url,
  }) => {
    try {
      const payload = { user_id, user_screen_name };
      if (webhook_url) payload.webhook_url = webhook_url;
      const response = await apiClient.post("/monitors/user-profile", payload);
      logger.info("User Profile Monitor created", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error creating user profile monitor", error);
      throw error;
    }
  },

  createPumpFunMonitor: async () => {
    // Pump.fun monitor is disabled due to cost restrictions.
    return {
      status: "error",
      message:
        "🚫 Pump.fun monitor creation is disabled due to cost restrictions.",
    };
  },

  listActiveMonitors: async (page = 1) => {
    try {
      const response = await apiClient.get("/monitors", { params: { page } });
      logger.info("Fetched active monitors", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error listing active monitors", error);
      throw error;
    }
  },

  getMonitorDetails: async (monitorId) => {
    try {
      const response = await apiClient.get(`/monitors/${monitorId}`);
      logger.info("Fetched monitor details", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error getting monitor details", error);
      throw error;
    }
  },

  updateMonitorWebhook: async (monitorId, webhook_url) => {
    try {
      const response = await apiClient.patch(`/monitors/${monitorId}`, {
        webhook_url,
      });
      logger.info("Updated monitor webhook", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error updating monitor webhook", error);
      throw error;
    }
  },

  deleteMonitor: async (monitorId) => {
    try {
      const response = await apiClient.delete(`/monitors/${monitorId}`);
      logger.info("Deleted monitor", response.data);
      return response.data;
    } catch (error) {
      logger.error("Error deleting monitor", error);
      throw error;
    }
  },
};
