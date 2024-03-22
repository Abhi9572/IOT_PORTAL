// controllers/activityDownloadController.js

const { downloadActivityData } = require("../controllers/activityController");
const deviceModel = require("../models/DeviceStatus");
const {
  calculateOnOffDuration,
} = require("../controllers/deviceStatusController");

async function downloadActivity(req, res) {
  try {
    const deviceId = req.params.deviceId;
    const { startDate, endDate } = req.query;

    // Check if startDate and endDate are provided
    if (!startDate || !endDate) {
      return res.status(400).send("Please provide both startDate and endDate.");
    }

    // Parse startDate and endDate into Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Fetch activity data for the specified deviceId
    const activity = await calculateOnOffDuration(deviceId);

    // Find the device name associated with the deviceId
    const device = await deviceModel.findOne({ deviceId }, "deviceName");
    const deviceName = device ? device.deviceName : "Unknown Device";

    // Download activity data for the specified date range
    const excelData = await downloadActivityData(
      activity,
      deviceName,
      deviceId,
      startDateObj,
      endDateObj
    );

    // If no activity data found for the specified date range, return a message
    if (!excelData) {
      return res.send("No activity data found for the specified date range.");
    }

    // Set the response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${deviceId}_activity.xlsx"`
    );

    // Send the Excel data as a response
    res.send(excelData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { downloadActivity };
