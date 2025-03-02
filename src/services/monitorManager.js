const socialDataService = require("./socialDataService");
const logger = require("../utils/logger");

const createMonitor = async (type, params) => {
  try {
    switch (type) {
      case "user_tweets":
        return await socialDataService.createUserTweetsMonitor(params);
      case "user_following":
        return await socialDataService.createUserFollowingMonitor(params);
      case "user_profile":
        return await socialDataService.createUserProfileMonitor(params);
      case "pump_fun":
        return await socialDataService.createPumpFunMonitor();
      default:
        throw new Error("Invalid monitor type");
    }
  } catch (error) {
    logger.error("Error creating monitor", error);
    throw error;
  }
};

const deleteMonitor = async (monitorId) => {
  try {
    return await socialDataService.deleteMonitor(monitorId);
  } catch (error) {
    logger.error("Error deleting monitor", error);
    throw error;
  }
};

const getMonitorDetails = async (monitorId) => {
  try {
    return await socialDataService.getMonitorDetails(monitorId);
  } catch (error) {
    logger.error("Error fetching monitor details", error);
    throw error;
  }
};

const listMonitors = async (page) => {
  try {
    return await socialDataService.listActiveMonitors(page);
  } catch (error) {
    logger.error("Error listing monitors", error);
    throw error;
  }
};

module.exports = {
  createMonitor,
  deleteMonitor,
  getMonitorDetails,
  listMonitors,
};
