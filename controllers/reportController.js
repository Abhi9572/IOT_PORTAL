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
    res.render("report", { deviceStatusData, user: user });
  } catch (error) {
    console.error("Error fetching device status data:", error);
    // Handle errors as needed
    res.render("error", { message: "Internal server error" });
  }
}

async function getReportData(req, res) {
  const { deviceid, filter } = req.body;
  console.log(deviceid, filter);

  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    let statusData;

    switch (filter) {
      case "getDeviceById":
        statusData = await DeviceStatus.find({
          deviceId: deviceid,
          userId: user._id,
        });
        console.log(statusData);
        break;
      case "getByDate":
        const date = req.body.date;
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        statusData = await DeviceStatus.find({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          userId: user._id,
        });
        break;
      case "getByDateRange":
        const startDate = req.body.startDate;
        const endDate = req.body.endDate;
        const startOfStartDate = new Date(startDate);
        startOfStartDate.setHours(0, 0, 0, 0);
        const endOfEndDate = new Date(endDate);
        endOfEndDate.setHours(23, 59, 59, 999);
        statusData = await DeviceStatus.find({
          createdAt: { $gte: startOfStartDate, $lte: endOfEndDate },
          userId: user._id,
        });
        break;
      default:
        throw new Error("Invalid filter criteria");
    }

    console.log(statusData);

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
    res.render("error", { message: "Internal server error" });
  }
}

module.exports = { getReport, getReportData };
