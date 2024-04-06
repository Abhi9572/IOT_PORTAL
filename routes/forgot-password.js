const express = require("express");
const router = express.Router();
const userModel = require("../models/users");

// Route to send JSON response for the forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { error: req.flash("error") });
});

// Route for handling submission of forgot password form
router.post("/forgot-password", async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  try {
    // Check if newPassword and confirmPassword match
    if (!newPassword || !confirmNewPassword) {
      req.flash("error", "Please fill in all required fields. ");
      return res.redirect("/forgot-password");
    }
    if (newPassword !== confirmNewPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/forgot-password");
    }

    // Find the user by their email
    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Set the new hashed password for the user
    user.password = hashedPassword;

    // Save the updated user object
    await user.save();

    //console.log(user);

    //Render the password-changed-confirmatio.ejs file
    return res.render("password-changed-confirmation");
  } catch (error) {
    console.error(error);
    req.flash("error", "Internal server error");
    return res.redirect("/forgot-password");
  }
});

module.exports = router;
