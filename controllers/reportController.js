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

    // const deviceStatusData = result.reverse();
    //   console.log(deviceStatusData);

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

async function getReportData(req, res) {
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
    let statusData;

    switch (filter) {
      case "getDeviceById":
        const deviceid = req.body.deviceid;
        // Check if device ID is provided
        if (!deviceid) {
          req.flash("error", "Please provide a Device ID");
          return res.redirect("/report");
        }
        statusData = await DeviceStatus.find({
          deviceId: deviceid,
          userId: user._id,
        });
        //console.log(statusData);
        if (statusData.length === 0) {
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
        statusData = await DeviceStatus.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          userId: user._id,
        });
        if (statusData.length === 0) {
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
        statusData = await DeviceStatus.find({
          createdAt: { $gte: startOfStartDate, $lte: endOfEndDate },
          userId: user._id,
        });
        if (statusData.length === 0) {
          req.flash("error", "No device data found for the specified date range.");
          return res.redirect("/report");
        }
        break;
      default:
        throw new Error("Invalid filter criteria");
    }

    //console.log(statusData);

    // Render the appropriate view based on the filter criteria
    switch (filter) {
      case "getDeviceById":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("reportByDeviceId", {
          statusData: statusData,
          userId: user._id,
          user,
        });
        break;
      case "getByDate":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("reportByDeviceId", {
          statusData: statusData,
          userId: user._id,
          user,
        });
        break;
      case "getByDateRange":
        // Set appropriate headers to prevent caching
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        res.render("reportByDeviceId", {
          statusData: statusData,
          userId: user._id,
          user,
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

module.exports = { getReport, getReportData };
