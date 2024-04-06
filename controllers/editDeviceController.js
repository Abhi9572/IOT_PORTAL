const Device = require("../models/devices");
const userModel = require("../models/users");

// Display edit device form
exports.editDeviceForm = async function (req, res) {
  try {
    const deviceId = req.params.id;

    const device = await Device.findById(deviceId);

    if (!device) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });

    // Check if the user exists
    if (!user) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Render the edit device form with the device details
    res.render("editDevice", {
      device: device,
      user: user,
      error: req.flash("error"),
    });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Internal server error", error: error });
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

    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Redirect to device list page after successful update
    res.redirect("/devicelist");
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Internal server error", error: error });
  }
};
