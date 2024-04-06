// controllers/activityDownloadController.js

const { downloadActivityData } = require("../controllers/activityController");
const userModel = require("../models/users");
const deviceModel = require("../models/devices");
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

    // Retrieve the user from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    //console.log(user);
    if (!user) {
      console.error("User not found.");
      return res.status(404).json({ error: "User not found" });
    }

    // Get the user's ID
    const userId = user._id;
    // Parse startDate and endDate into Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Fetch activity data for the specified deviceId
    const activity = await calculateOnOffDuration(deviceId, userId);

    // Find the device name associated with the deviceId
    const device = await deviceModel.findOne(
      { deviceId, user: user._id },
      "deviceName"
    );
    console.log(device);
    const deviceName = device ? device.deviceName : "Unknown Device";
    console.log(deviceName);

    // Download activity data for the specified date range
    const excelData = await downloadActivityData(
      activity,
      deviceName,
      deviceId,
      startDateObj,
      endDateObj
    );
    console.log(excelData);

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
