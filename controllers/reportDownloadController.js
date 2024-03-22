// controllers/reportDownloadController.js

const DeviceStatus = require("../models/DeviceStatus");
const { downloadReportData } = require("../controllers/activityController");

async function downloadReport(req, res) {
  try {
    // Fetch data from the DeviceStatus model
    const deviceStatusData = await DeviceStatus.find(
      {},
      "deviceId status createdAt"
    );

    // Download the report data as an Excel file
    const excelBuffer = await downloadReportData(deviceStatusData);

    // Set the response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="device_status_report.xlsx"'
    );

    // Send the Excel file as a response
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error downloading report data:", error);
    // Handle errors as needed
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { downloadReport };
