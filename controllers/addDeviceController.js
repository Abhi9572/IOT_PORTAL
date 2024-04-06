// controllers/addDeviceController.js
//const verifyToken = require('../middleware/auth');

const deviceModel = require("../models/devices");
const userModel = require("../models/users");
const mqttController = require("./MqttController");
const DeviceStatus = require("../models/DeviceStatus"); // Import DeviceStatus model

async function addDevice(req, res) {
  const { devicename, deviceid } = req.body;

  // Check if deviceName and deviceId are provided
  if (!devicename || !deviceid) {
    // return res.status(400).json({ success: false, message: 'Please provide both info about the device.' });  //in JSON Method Only FOR API

    req.flash("error", "Please provide both info about the device.");
    return res.redirect("/adddevice");
  }

  try {
    // // Verify the JWT token and extract the user ID
    // verifyToken(req, res, async function(err) {
    //   if (err) {
    //     return res.status(401).json({ success: false, error: err.message });
    //   }

      // // Fetch the user from the database using the decoded user ID
      // const user = await userModel.findById(req.userId);
      // console.log(user);

      // Get the user from the session
      const user = await userModel.findOne({
        username: req.session.passport.user,
      });
      console.log(user);

      if (!user) {
        // return res.status(404).json({ success: false, message: 'User not found' });  //in JSON Method Only FOR API

        console.error("User not found.");
        req.flash("error", "User not found.");
        return res.status(404).send("User not found");
      }

      // Check if deviceId is already saved for the user
      const existingDeviceId = await deviceModel.findOne({
        deviceId: deviceid,
        user: user._id,
      });

      console.log(existingDeviceId);

      if (existingDeviceId) {
        //return res.status(400).json({ success: false, message: 'Device Id is already in use. Please save another device.' });  //in JSON Method Only FOR API

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
        'deviceId status createdAt'
      );
      //console.log(deviceStatusData);


      // Set appropriate headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

      //return res.status(200).json({ success: true, message: 'Device saved successfully.' }); //in JSON Method Only FOR API
      req.flash("success", "Device saved successfully.");
      res.redirect("/adddevice");
  } catch (error) {
    console.error(error);
    //return res.status(500).json({ success: false, message: 'An error occurred during adding of devices. Please try again.' });  //in JSON Method Only FOR API
    req.flash(
      "error",
      "An error occurred during adding of devices. Please try again."
    );
    res.redirect("/adddevice");

  }
}



async function showAddDevice(req, res) {
  try {
    // // Verify the JWT token and extract the user ID
    // verifyToken(req, res, async function(err) {
    //   if (err) {
    //     return res.status(401).json({ success: false, message: err.message });
    //   }

    //   // Fetch the user from the database using the decoded user ID
    //   const user = await userModel.findById(req.userId);

      const user = await userModel.findOne({
        username: req.session.passport.user,
      });
      if (!user) {
      //  return res.status(404).json({ success: false, message: 'User not found' }); //in JSON Method Only FOR API

        console.error("User not found.");
        req.flash("error", "User not found.");
        return res.status(404).send("User not found");
      }

      // Set appropriate headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');


      res.render("adddevice", { user: user, error: req.flash("error") });

      //in JSON Method Only FOR API
      // // Exclude password field from user object
      // const userWithoutPassword = { ...user.toObject(), password: undefined };

      // return res.status(200).json({ success: true, user:userWithoutPassword });
  } catch (error) {
    console.error(error);
    //return res.status(500).json({ success: false, message: 'An error occurred while fetching user information.' });  //in JSON Method Only FOR API
    req.flash(
      "error",
      "An error occurred during adding of devices. Please try again."
    );
    res.redirect("/adddevice");
  }
}

module.exports = { addDevice, showAddDevice };
