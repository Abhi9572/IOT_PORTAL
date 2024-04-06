const express = require("express");
//const bcrypt = require('bcrypt');
const router = express.Router();
const userModel = require("../models/users");


// Route to send JSON response for the forgot password page
router.get("/forgot-password", (req, res) => {
  // res.status(200).json({ success:'true', message: "Forgot password page accessed successfully" }); 
  res.render("forgot-password", { error: req.flash("error") });
});

// Route for handling submission of forgot password form
router.post("/forgot-password", async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  try {
    // Check if newPassword and confirmPassword match
    if (!newPassword || !confirmNewPassword) {
      // return res.status(400).json({ success: false, message: "Please fill all required fields" }); //in JSON Method Only FOR API
      req.flash("error", "Please fill in all required fields. ");
      return res.redirect("/forgot-password");
    }
    if (newPassword !== confirmNewPassword) {
      // return res.status(400).json({ success: false, message: "Passwords do not match" }); //in JSON Method Only FOR API
      req.flash("error", "Passwords do not match.");
      return res.redirect("/forgot-password");
    }

    // Find the user by their email
    const user = await userModel.findOne({ email });

    if (!user) {
      // return res.status(404).json({ success: false, message: "User not found" }); //in JSON Method Only FOR API
      req.flash("error", "User not found.");
      return res.redirect("/forgot-password");
    }

    //set the new password
    user.setPassword(newPassword, async () => {
      await user.save();
      //Render the password-changed-confirmatio.ejs file
      return res.render("password-changed-confirmation");
    });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ success: false, message: "Internal server error" });  //in JSON Method Only FOR API
    req.flash("error", "Internal server error");
    return res.redirect("/forgot-password");
  }
});



module.exports = router;
