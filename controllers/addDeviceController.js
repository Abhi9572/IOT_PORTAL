// controllers/addDeviceController.js

const deviceModel = require("../models/devices");
const userModel = require("../models/users");
const mqttController = require("./MqttController");
const DeviceStatus = require("../models/DeviceStatus"); // Import DeviceStatus model

async function addDevice(req, res) {
  const { devicename, deviceid } = req.body;

  // Check if deviceName and deviceId are provided
  if (!devicename || !deviceid) {
    req.flash("error", "Please provide both info about the device.");
    return res.redirect("/adddevice");
  }

  try {
    // Get the user's username from the session
    const username = req.session.passport.user;

    // Find the user based on the username
    const user = await userModel.findOne({ username });

    if (!user) {
      console.error("User not found.");
      req.flash("error", "User not found.");
      return res.status(404).send("User not found");
    }

    // Check if deviceId is already saved for the user
    const existingDeviceId = await deviceModel.findOne({
      deviceId: deviceid,
      user: user._id,
    });

    if (existingDeviceId) {
      // If device id already exists for the user, flash an error message
      req.flash(
        "error",
        "Device Id is already in use. Please save another device."
      );
      return res.redirect("/adddevice");
    }

    // Create the device and associate it with the user
    const device = await deviceModel.create({
      deviceName: devicename,
      deviceId: deviceid,
      user: user._id,
    });

    // Update user's devices array
    await userModel.findByIdAndUpdate(user._id, {
      $push: { devices: device._id },
    });

    // Initialize MQTT for the user
    mqttController.init(user);

    // Fetch DeviceStatus data related to the user
    const deviceStatusData = await DeviceStatus.find(
      { userId: user._id },
      "deviceId status createdAt"
    );
    //console.log(deviceStatusData);

    req.flash("success", "Device saved successfully.");
    res.redirect("/adddevice");
  } catch (error) {
    console.error(error);
    req.flash(
      "error",
      "An error occurred during adding of devices. Please try again."
    );
    res.redirect("/adddevice");
  }
}

module.exports = { addDevice };
