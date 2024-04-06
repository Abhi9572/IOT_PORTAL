const userModel = require("../models/users");

const deviceModel = require("../models/devices");

async function dashboard(req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    console.log(user);
    if (!user) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Count devices related to the user
    const devices = await deviceModel.find({ user: user._id });
    const count = devices.length;

    // Set appropriate headers to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Render the dashboard with user and device count
    res.render("dashboard", {
      user: user,
      count: count,
    });
  } catch (error) {
    console.error("Error fetching user or counting devices:", error);
    res.render("error", { message: "Error fetching user or counting devices" });
  }
}

module.exports = { dashboard };
