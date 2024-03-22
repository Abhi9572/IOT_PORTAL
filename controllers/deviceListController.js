// controllers/deviceListController.js

const userModel = require("../models/users");
const DeviceStatus = require("../models/DeviceStatus");

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
    const deviceStatuses = await DeviceStatus.find({
      createdAt: { $gte: oneMinuteBefore, $lte: oneMinuteAfter },
    });

    res.render("devicelist", { user:user, deviceStatuses, error: req.flash("error") }); // Pass device statuses to the view
  } catch (err) {
    console.error("Error fetching device list:", err);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { getDeviceList };



