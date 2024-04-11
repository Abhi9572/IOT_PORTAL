// controllers/reportController.js

const DeviceStatus = require("../models/DeviceStatus");
const userModel = require("../models/users");

async function getReport(req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    if (!user) {
      console.error("User not found.");
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Fetch data from the DeviceStatus model for the authenticated user
    const deviceStatusData = await DeviceStatus.find(
      { userId: user._id },
      "deviceId status userId createdAt"
    ).sort({ createdAt: -1 });

    // const devicedeviceStatusData = result.reverse();
    //   console.log(devicedeviceStatusData);

    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Render the report.ejs file and pass the data to it
    res.render("report", { deviceStatusData, user: user, error: req.flash("error") });
  } catch (error) {
    console.error("Error fetching device status data:", error);
    // Handle errors as needed
    res.render("error", { message: "Internal server error" });
  }
}

async function getReportDataByFilter(req, res) {
  const { filter } = req.body;
  console.log(filter);

  try {
    // Check if filter method is selected
    if (!filter) {
      req.flash("error", "Please select a method");
      return res.redirect("/report");
    }

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    let deviceStatusData;

    switch (filter) {
      case "getDeviceById":
        const deviceid = req.body.deviceid;
        // Check if device ID is provided
        if (!deviceid) {
          req.flash("error", "Please provide a Device ID");
          return res.redirect("/report");
        }
        deviceStatusData = await DeviceStatus.find({
          deviceId: deviceid,
          userId: user._id,
        });
        //console.log(deviceStatusData);
        if (deviceStatusData.length === 0) {
          req.flash("error", "Device ID not found. Please provide a valid Device ID");
          return res.redirect("/report");
        }
        break;
      case "getByDate":
        const date = req.body.date;
        // Check if date is provided
        if (!date) {
          req.flash("error", "Please provide a date");
          return res.redirect("/report");
        }
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        deviceStatusData = await DeviceStatus.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          userId: user._id,
        });
        if (deviceStatusData.length === 0) {
          req.flash("error", "No device data found for the specified date.");
          return res.redirect("/report");
        }
        break;
      case "getByDateRange":
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        // Check if start date and end date are provided
        if (!req.body.startDate || !req.body.endDate) {
          req.flash("error", "Please provide start and end dates");
          return res.redirect("/report");
        }
        const startOfStartDate = new Date(startDate);
        startOfStartDate.setHours(0, 0, 0, 0);
        const endOfEndDate = new Date(endDate);
        endOfEndDate.setHours(23, 59, 59, 999);
        deviceStatusData = await DeviceStatus.find({
          createdAt: { $gte: startOfStartDate, $lte: endOfEndDate },
          userId: user._id,
        });
        if (deviceStatusData.length === 0) {
          req.flash("error", "No device data found for the specified date range.");
          return res.redirect("/report");
        }
        break;
      default:
        throw new Error("Invalid filter criteria");
    }

    //console.log(deviceStatusData);

    // Render the appropriate view based on the filter criteria
    switch (filter) {
      case "getDeviceById":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("report", {
          deviceStatusData: deviceStatusData,
          userId: user._id,
          user,
          error: req.flash("error"),
        });
        break;
      case "getByDate":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("report", {
          deviceStatusData: deviceStatusData,
          userId: user._id,
          user,
          error: req.flash("error"),
        });
        break;
      case "getByDateRange":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("report", {
          deviceStatusData: deviceStatusData,
          userId: user._id,
          user,
          error: req.flash("error")
        });
        break;
      default:
        throw new Error("Invalid filter criteria");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while processing your request");
    res.redirect("/report");
  }
}

async function generateReportForDeviceById(deviceId, userId) {
  // Fetch data based on device ID and user ID
  const deviceStatusData = await DeviceStatus.find({
    deviceId: deviceId,
    userId: userId,
  }, "deviceId status createdAt");

  return deviceStatusData;
}

async function generateReportForDate(date, userId) {
  // Parse date string to Date object
  const selectedDate = new Date(date);
  // Set start and end of the selected date
  const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

  // Fetch data within the selected date range and user ID
  const deviceStatusData = await DeviceStatus.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    userId: userId,
  }, "deviceId status createdAt");

  return deviceStatusData;
}

async function generateReportForDateRange(startDate, endDate, userId) {
  // Parse start date and end date strings to Date objects
  const startOfStartDate = new Date(startDate);
  const endOfEndDate = new Date(endDate);
  // Set start of start date to beginning of the day and end of end date to end of the day
  startOfStartDate.setHours(0, 0, 0, 0);
  endOfEndDate.setHours(23, 59, 59, 999);

  // Fetch data within the date range and user ID
  const deviceStatusData = await DeviceStatus.find({
    createdAt: { $gte: startOfStartDate, $lte: endOfEndDate },
    userId: userId,
  }, "deviceId status createdAt");

  return deviceStatusData;
}


module.exports = { getReport, getReportDataByFilter, generateReportForDate, generateReportForDateRange,generateReportForDeviceById };
