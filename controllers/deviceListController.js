// controllers/deviceListController.js
require("dotenv").config();
//const verifyToken = require('../middleware/auth');
const userModel = require("../models/users");
const Device = require("../models/devices");
const DeviceStatus = require("../models/DeviceStatus");
const mqtt = require("mqtt");

async function getDeviceList(req, res) {
  try {
    const user = await userModel
      .findOne({
        username: req.session.passport.user,
      })
      .populate("devices");

    if (!user) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }
    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.render("devicelist", {
      user: user,

      error: req.flash("error"),
    }); // Pass device statuses to the view
  } catch (error) {
    console.error("Error fetching device list:", error);
    res.render("error", { message: "Internal server error" });
  }
}

async function updateStatus(req, res) {
  try {
    // Retrieve device ID and status from the request body
    const { status, deviceId } = req.body;

    // Find the device in the database based on the deviceId
    const device = await Device.findOne({ deviceId });

    // Check if the device exists
    if (!device) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Retrieve the user from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    //console.log(user);

    // Check if the user exists
    if (!user) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Save the updated status to the DeviceStatus collection
    const deviceStatus = new DeviceStatus({
      deviceId: device.deviceId,
      devicePrimaryId: device._id,
      userId: user._id,
      status: status, // Using the status from the request body
    });

    // Save the deviceStatus object to the database
    await deviceStatus.save();

    // Update the device status in the Device collection
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId, user: user._id },
      { statusDevice: status },
      { new: true }
    );

    // MQTT Broker Connection

    const mqttOptions = {
      protocol: process.env.MQTT_PROTOCOL,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    };
    const mqttClient = mqtt.connect(process.env.MQTT_BROKER, mqttOptions);

    mqttClient.on("connect", function () {
      mqttClient.publish(deviceId, status, function (err) {
        if (err) {
          //console.error('Error publishing MQTT message:', err);
          res
            .status(500)
            .json({
              success: "false",
              message: "Error publishing MQTT message",
            });
        } else {
          res
            .status(200)
            .json({
              success: "true",
              message: "Device status toggled successfully",
              device: updatedDevice,
            });
        }
        mqttClient.end();
      });
    });
    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } catch (error) {
    console.error("Error toggling device status:", error);
    res.render("error", { message: "Internal server error" });
  }
}

module.exports = { getDeviceList, updateStatus };
