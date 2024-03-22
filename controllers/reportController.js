// controllers/reportController.js

const DeviceStatus = require("../models/DeviceStatus");
const userModel = require("../models/users");

async function getReport(req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    //device
    // console.log(user.username);
    // Fetch data from the DeviceStatus model
    const deviceStatusData = await DeviceStatus.find(
      { userId: user._id },
      "deviceId status userId createdAt"
    );
    console.log(deviceStatusData);

    // Render the report.ejs file and pass the data to it
    res.render("report", { deviceStatusData, user: user });
  } catch (error) {
    console.error("Error fetching device status data:", error);
    // Handle errors as needed
    res.status(500).send("Internal Server Error");
  }
}

async function getReportData(req, res) {
  const { deviceid, filter } = req.body;

  try {
    let statusData;
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    switch (filter) {
      case "getDeviceById":
        statusData = await DeviceStatus.find({
          deviceId: deviceid,
          userId: user._id,
        });
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

    // Render the appropriate view based on the filter criteria
    switch (filter) {
      case "getDeviceById":
        res.render("reportByDeviceId", {
          statusData: statusData,
          userId: user._id,
          user,
        });
        break;
      case "getByDate":
        res.render("reportByDeviceId", {
          statusData: statusData,
          userId: user._id,
          user,
        });
        break;
      case "getByDateRange":
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
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { getReport, getReportData };
