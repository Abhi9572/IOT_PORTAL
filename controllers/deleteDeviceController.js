//deleteDeviceController.js

const Device = require("../models/devices");

exports.deleteDevice = async function (req, res) {
  try {
    const deviceId = req.params.id;

    // Delete the device by ID
    const deletedId = await Device.findByIdAndDelete(deviceId);

    console.log(deletedId);
    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    //Redirect to the devicelis page after successful deletion
    res.redirect("/devicelist");
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Internal server error" });
  }
};
