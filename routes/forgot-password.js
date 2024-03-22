const express = require("express");

const router = express.Router();
const userModel = require("../models/users");

//Route to render the forgot password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { error: req.flash("error") });
});

//route for handling submission of forgot password form
router.post("/forgot-password", async (req, res) => {
  const { email, newPassword, confirmNewPassword } = req.body;

  try {
    //check if newPassword and confirmpassword match
    if (!newPassword || !confirmNewPassword) {
      req.flash("error", "Please fill all required fields");
      return res.redirect("/forgot-password");
    }
    if (newPassword !== confirmNewPassword) {
      req.flash("error", "Password do not match");
      return res.redirect("/forgot-password");
    }

    //find the user by their email
    const user = await userModel.findOne({ email });

    if (!user) {
      req.flash("error", "User not found");
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
    req.flash("error", "Internal server error");
    return res.redirect("/forgot-password");
  }
});

module.exports = router;
