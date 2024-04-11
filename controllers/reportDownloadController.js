// controllers/reportDownloadController.js
const userModel = require("../models/users");
const DeviceStatus = require("../models/DeviceStatus");
const { downloadReportData } = require("../controllers/activityController");
const { generateReportForDate, generateReportForDateRange, generateReportForDeviceById } = require("../controllers/reportController");

async function downloadReport(req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    // Fetch data from the DeviceStatus model
    let deviceStatusData;
    console.log(deviceStatusData);

    // Logic to filter data based on the selected filter criteria
    const { filter } = req.query;
    console.log(filter);
    switch (filter) {
      case "getDeviceById":
        // Add logic to fetch filtered data based on device ID
        const deviceId = req.query.deviceid;
        if (!deviceId) {
          req.flash("error", "Please provide a Device ID");
          return res.redirect("/report");
        }
        deviceStatusData = await generateReportForDeviceById(deviceId, user._id);
        //console.log(deviceStatusData);
        if (deviceStatusData.length === 0) {
          req.flash("error", "Device ID not found. Please provide a valid Device ID");
          return res.redirect("/report");
        }
        break;
      case "getByDate":
        // Add logic to fetch filtered data based on date
        const date = req.query.date;
        if (!date) {
          req.flash("error", "Please provide a date");
          return res.redirect("/report");
        }
        deviceStatusData = await generateReportForDate(date, user._id);
        if (deviceStatusData.length === 0) {
          req.flash("error", "No device data found for the specified date.");
          return res.redirect("/report");
        }
        break;
      case "getByDateRange":
        // Add logic to fetch filtered data based on date range
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        if (!startDate || !endDate) {
          req.flash("error", "Please provide start and end dates");
          return res.redirect("/report");
        }
        deviceStatusData = await generateReportForDateRange(startDate, endDate, user._id);
        if (deviceStatusData.length === 0) {
          req.flash("error", "No device data found for the specified date range.");
          return res.redirect("/report");
        }
        break;
      default:
        // Fetch all data if no filter is applied
        deviceStatusData = await DeviceStatus.find({}, "deviceId status createdAt");
        break;
    }

    // Generate Excel file using the filtered data
    const excelBuffer = await downloadReportData(deviceStatusData);
    console.log(excelBuffer);

    // Send the Excel file as a response
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="device_status_report.xlsx"'
    );
    res.send(excelBuffer);

  } catch (error) {
    console.error("Error downloading report data:", error);
    // Handle errors as needed
    res.render("error", { message: "Internal server error" });
  }
}


module.exports = { downloadReport };
