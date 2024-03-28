// controllers/deviceListController.js
require("dotenv").config();
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
    // console.log(user.username);

    //const userName = await userModel.findOne({username: req.session.passport.user});
    // console.log(userName);

    // Calculate time range for fetching device statuses
    const currentTime = new Date();
    const oneMinuteBefore = new Date(currentTime.getTime() - 60000); // 1 minute before
    const oneMinuteAfter = new Date(currentTime.getTime() + 60000); // 1 minute after

    // Fetch device statuses within the time range
    // const deviceStatuses = await DeviceStatus.find({
    //   createdAt: { $gte: oneMinuteBefore, $lte: oneMinuteAfter },
    // });
    //const devices = await Device.find({ statusDevice });


    res.render("devicelist", {
      user: user,
      
      error: req.flash("error"),
    }); // Pass device statuses to the view
  } catch (err) {
    console.error("Error fetching device list:", err);
    res.status(500).send("Internal Server Error");
  }
}


async function updateStatus(req, res) {
  try {
    // Retrieve device ID and status from the request body
    const { status, deviceId } = req.body;
    // return console.log({ status, deviceId });

    // Find the device in the database based on the deviceId
    const device = await Device.findOne({ deviceId });

    // Check if the device exists
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Retrieve the user from the session
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    //console.log(user);
    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the device status
    // device.status = status;
    // await device.save();

    // Save the updated status to the DeviceStatus collection
    const deviceStatus = new DeviceStatus({
      deviceId: device.deviceId,
      devicePrimaryId: device._id,
      userId: user._id,
      status: status, // Using the status from the request body
    });

    // Save the deviceStatus object to the database
    await deviceStatus.save();
    //console.log(deviceStatus);
    const updatedDevice = await Device.findOneAndUpdate({ deviceId, user: user._id }, { statusDevice:status }, { new: true });
    //console.log(updatedDevice);

    // Optionally, you can perform additional actions here, such as sending notifications, etc.
    // MQTT Broker Connection
    const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

    mqttClient.on('connect', function () {
      mqttClient.publish(deviceId, status, function (err) {
        if (err) {
          console.error('Error publishing MQTT message:', err);
          res.status(500).json({ error: 'Error publishing MQTT message' });
        } else {
          res.status(200).json({ message: "Device status toggled successfully", device: updatedDevice });
        }
        mqttClient.end();
      });
    });
  } catch (error) {
    console.error("Error toggling device status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { getDeviceList, updateStatus };
