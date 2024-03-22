// controllers/deviceStatusController.js

const DeviceStatus = require("../models/DeviceStatus");
const moment = require("moment");

async function calculateOnOffDuration(deviceId, userId) {
  try {
    const statuses = await DeviceStatus.find({ deviceId, userId }).sort({
      createdAt: 1,
    });

    const activity = {};

    statuses.forEach((status) => {
      const date = moment(status.createdAt).format("YYYY-MM-DD");
      if (!activity[date]) {
        activity[date] = {
          totalOnDuration: 0,
          totalOffDuration: 0,
          lastOnTime: null,
        };
      }

      if (status.status === "on") {
        activity[date].lastOnTime = moment(status.createdAt);
      } else if (status.status === "off" && activity[date].lastOnTime) {
        const offTime = moment(status.createdAt);
        const duration = offTime.diff(activity[date].lastOnTime, "seconds"); // Duration in seconds
        activity[date].totalOnDuration += duration;
        activity[date].lastOnTime = null;
      }
    });

    // Calculate total off duration for each day (24 hours - total on duration)
    for (const date in activity) {
      activity[date].totalOffDuration =
        24 * 60 * 60 - activity[date].totalOnDuration;
      // Convert durations to hours, minutes, and seconds
      activity[date].onDuration = convertSecondsToTime(
        activity[date].totalOnDuration
      );
      activity[date].offDuration = convertSecondsToTime(
        activity[date].totalOffDuration
      );
    }

    return activity;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

function convertSecondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const remainingMinutes = remainingSeconds % 60;
  return { hours, minutes, seconds: remainingMinutes };
}

module.exports = { calculateOnOffDuration };
