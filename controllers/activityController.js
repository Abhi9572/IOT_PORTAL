// controllers/activityController.js
const userModel = require("../models/users");
const deviceModel = require("../models/devices");
const {
  calculateOnOffDuration,
} = require("../controllers/deviceStatusController");
const XlsxPopulate = require("xlsx-populate");
const ExcelJS = require("exceljs");

// Function to download activity data in Excel format
async function downloadActivityData(
  activity,
  deviceName,
  deviceId,
  startDate,
  endDate
) {
  try {
    // Filter activity data based on the specified date range
    const filteredActivity = {};
    Object.keys(activity).forEach((date) => {
      const currentDate = new Date(date);
      if (currentDate >= startDate && currentDate <= endDate) {
        filteredActivity[date] = activity[date];
      }
    });

    // If no activity data found for the specified date range, return null
    if (Object.keys(filteredActivity).length === 0) {
      return null;
    }

    // Prepare the Excel file content
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet(0);
    sheet.cell("A1").value("DeviceName (Device ID)");
    sheet.cell("B1").value("On Duration (hours)");
    sheet.cell("C1").value("Off Duration (hours)");
    sheet.cell("D1").value("Date");

    let row = 2;
    Object.keys(filteredActivity).forEach((date) => {
      const data = filteredActivity[date];
      const onDuration = `${data.onDuration.hours} hours ${data.onDuration.minutes} minutes ${data.onDuration.seconds} seconds`;
      const offDuration = `${data.offDuration.hours} hours ${data.offDuration.minutes} minutes ${data.offDuration.seconds} seconds`;
      sheet.cell(`A${row}`).value(`${deviceName} (ID: ${deviceId})`);
      sheet.cell(`B${row}`).value(onDuration);
      sheet.cell(`C${row}`).value(offDuration);
      sheet.cell(`D${row}`).value(date);
      row++;
    });

    // Convert the workbook to a buffer
    const buffer = await workbook.outputAsync();

    return buffer;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error occurred while downloading activity data.");
  }
}

//function to download report Data in excel format
async function downloadReportData(deviceStatusData) {
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Device Status");

    // Add headers to the first row
    sheet.addRow(["Device Name", "Device ID", "Status", "Created At"]);

    // Fetch device names based on device IDs
    const deviceIds = deviceStatusData.map((data) => data.deviceId);
    const devices = await deviceModel.find(
      { deviceId: { $in: deviceIds } },
      "deviceId deviceName"
    );

    // Map device IDs to their corresponding names for easier lookup
    const deviceNameMap = {};
    devices.forEach((device) => {
      deviceNameMap[device.deviceId] = device.deviceName;
    });

    // Add data to subsequent rows
    deviceStatusData.forEach((data) => {
      const createdAt = new Date(data.createdAt).toLocaleString(); // Convert timestamp to human-readable format
      const deviceName = deviceNameMap[data.deviceId] || "N/A"; // Use 'N/A' if device name is not found
      sheet.addRow([deviceName, data.deviceId, data.status, createdAt]);
    });

    // Convert the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return buffer;
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error("Error generating Excel file.");
  }
}

async function getActivity(req, res) {
  try {
    // Extract deviceId from the request parameters
    const deviceId = req.params.deviceId;

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

    // Assuming you have a function to calculate on/off durations
    const activity = await calculateOnOffDuration(deviceId, userId); // Call your calculateOnOffDuration function

    // Find the device name associated with the deviceId
    const device = await deviceModel.findOne(
      { deviceId, user: userId },
      "deviceName"
    );

    // Check if device exists and extract its name
    const deviceName = device ? device.deviceName : "Unknown Device";

    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.render("activity", {
      activity,
      deviceId,
      deviceName,
      user: user,
    }); // Pass the activity data to the template
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ success: false, error: "Internal Server Error" });
  }
}

module.exports = { downloadActivityData, downloadReportData, getActivity };
