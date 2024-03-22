const Device = require("../models/devices");
const userModel = require("../models/users");

// Display edit device form
exports.editDeviceForm = async function (req, res) {
  try {
    const deviceId = req.params.id;
    console.log(deviceId);

    const device = await Device.findById(deviceId);
    console.log(device);

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Render the edit device form with the device details
    res.render("editDevice", {
      device: device,
      user: user,
      error: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Handle device update
exports.updateDevice = async function (req, res) {
  try {
    const { deviceName } = req.body;
    const deviceId = req.params.id;

    // Update device name
    const updatedDevice = await Device.findByIdAndUpdate(
      deviceId,
      { deviceName },
      { new: true }
    );

    // Redirect to device list page after successful update
    res.redirect("/devicelist");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
