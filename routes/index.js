const express = require("express");

const router = express.Router();
const mqtt = require("mqtt");
const bodyParser = require("body-parser");
const userModel = require("../models/users");
const deviceModel = require("../models/devices");
const passport = require("passport");
const localStrategy = require("passport-local");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

const mqttController = require("../controllers/MqttController");
const deviceListController = require("../controllers/deviceListController");
const {
  calculateOnOffDuration,
} = require("../controllers/deviceStatusController");

const { downloadActivityData } = require("../controllers/activityController");
const activityController = require("../controllers/activityController");
const addDeviceController = require("../controllers/addDeviceController");
const reportController = require("../controllers/reportController");
const reportDownloadController = require("../controllers/reportDownloadController");
const editDeviceController = require("../controllers/editDeviceController");
const deleteDeviceController = require("../controllers/deleteDeviceController");

passport.use(new localStrategy(userModel.authenticate()));
router.use(bodyParser.urlencoded({ extended: false }));

router.get("/", function (req, res) {
  res.render("index", { error: req.flash("error") });
});

router.get("/login", function (req, res) {
  res.render("login", { error: req.flash("error") });
});

router.get("/dashboard", isLoggedIn, async function (req, res) {
  try {
    const username = req.session.passport.user;
    //console.log("Username:", username);

    // Fetch the user from the database
    const user = await userModel.findOne({ username: username });
    //console.log("User:", user);

    if (!user) {
      console.error("User not found.");
      return res.render("error", { message: "User not found" });
    }

    // Initialize MQTT controller with the current user
    // mqttController.init(user);

    // Count devices related to the user
    const devices = await deviceModel.find({ user: user._id });
    //console.log("Devices:", devices);

    const count = devices.length;

    res.render("dashboard", {
      user: user,
      count: count,
    });
  } catch (error) {
    console.error("Error fetching user or counting devices:", error);
    res.render("error", { message: "Error fetching user or counting devices" });
  }
});

router.get("/devicelist", isLoggedIn, deviceListController.getDeviceList);

router.get("/editDevice/:id", isLoggedIn, editDeviceController.editDeviceForm);

router.post(
  "/editDevice/:id/update",
  isLoggedIn,
  editDeviceController.updateDevice
);

router.post("/deleteDevice/:id", deleteDeviceController.deleteDevice);

router.get("/:deviceId/activity", isLoggedIn, activityController.getActivity);

// // Route handler for downloading activity data in Excel format
router.get(
  "/:deviceId/activity/download",
  isLoggedIn,
  async function (req, res) {
    try {
      const deviceId = req.params.deviceId;
      const { startDate, endDate } = req.query;

      // Check if startDate and endDate are provided
      if (!startDate || !endDate) {
        return res
          .status(400)
          .send("Please provide both startDate and endDate.");
      }

      // Parse startDate and endDate into Date objects
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // Fetch activity data for the specified deviceId
      const activity = await calculateOnOffDuration(deviceId);

      // Find the device name associated with the deviceId
      const device = await deviceModel.findOne({ deviceId }, "deviceName");
      const deviceName = device ? device.deviceName : "Unknown Device";

      // Download activity data for the specified date range
      const excelData = await downloadActivityData(
        activity,
        deviceName,
        deviceId,
        startDateObj,
        endDateObj
      );

      // If no activity data found for the specified date range, return a message
      if (!excelData) {
        return res.send("No activity data found for the specified date range.");
      }

      // Set the response headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${deviceId}_activity.xlsx"`
      );

      // Send the Excel data as a response
      res.send(excelData);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/adddevice", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({
    username: req.session.passport.user,
  });
  res.render("adddevice", { user: user, error: req.flash("error") });
});

router.post("/adddevice", isLoggedIn, addDeviceController.addDevice);

router.post("/getReportData", isLoggedIn, reportController.getReportData);

//Define a route to render the report page

router.get("/report", isLoggedIn, reportController.getReport);

router.get(
  "/report/download",
  isLoggedIn,
  reportDownloadController.downloadReport
);


// POST route to update device status
router.post('/toggleDevice', deviceListController.updateStatus);


const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PASS,
  },
});

router.post("/register", async function (req, res) {
  const { username, email, password } = req.body;

  //check if all required fields are filled
  if (!username || !email || !password) {
    req.flash("error", "Please fill in all required fields. ");
    return res.redirect("/");
  }
  try {
    //Check if the email is valid
    if (!isValidEmail(email)) {
      req.flash("error", "Please provide a valid email address. ");
      return res.redirect("/");
    }

    //Check if the email is already registered
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      //if email already exist, flash an error msg
      req.flash(
        "error",
        "Email ID is already registered. Please use a different email ID."
      );
      return res.redirect("/");
    }

    const userData = new userModel({
      username,
      email,
      isVerified: false,
    });

    //Generate a verification token
    const verificationToken = uuidv4();

    //Save the verification token in the user's document
    userData.verificationToken = verificationToken;

    //Register user with passport-local-mongoose
    await userModel.register(userData, req.body.password);

    //send verification email
    const mailOptions = {
      from: process.env.MAIL_SERVICE,
      to: email,
      subject: "Email verification",
      html: `<p> Click <a href="${process.env.BASE_URL}/verify-email/${verificationToken}">here</a> to verify your email address.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        req.flash(
          "error",
          "Failed to send verification email. Please try again."
        );
        return res.redirect("/");
      } else {
        console.log("Email verification sent: " + info.response);
        req.flash(
          "success",
          "Verification email sent Successfully. Please check your email and verify your account."
        );
        res.redirect("/login");
      }
    });
  } catch (error) {
    console.error(error);
    req.flash(
      "error",
      "An error occured during registration. Please try again."
    );
    res.redirect("/");
  }
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const token = req.params.token;

    //update user's verification status to true in the database
    const updateResult = await userModel.updateOne(
      { verificationToken: token },
      { $set: { isVerified: true } }
    );

    console.log(updateResult);

    if (updateResult.nModified === 0) {
      //if no user is updated (no matching verification token), handle the error
      console.error("User not found for verification token:", token);
      req.flash(
        "error",
        "Invalid verification token. Please check your email or request a new verification email"
      );
      return res.redirect("/login");
    }

    //Render the email-verified.ejs page with a success message
    req.flash("sucess", "Email verification sucessful. You can now log in.");
    return res.render("email-verified", {
      message: "Your email has been verified successfully. You can now login.",
    });
  } catch (error) {
    //handle any error that occur during the process
    console.error("Error verifying email:", error);
    req.flash(
      "error",
      "An error occured during email verification.Please try again later."
    );
    return res.redirect("/login");
  }
});

router.get("/success", (req, res) => {
  res.render("success", { user: req.user });
});

router.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Authentication failed, redirect to login page
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      // After successful login and session establishment
      // Check if the user's email is verified
      if (!user.isVerified) {
        req.flash(
          "error",
          "Your email is not verified. Please verify your email."
        );
        return res.redirect("/login");
      }
      // If the user is verified, initialize mqttController with the user
      mqttController.init(user);
      // Redirect to dashboard
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    //check if the user's email is verified
    const user = req.user;
    if (!user.isVerified) {
      req.flash(
        "error",
        "Your email is not verified. Please verifiy your email."
      );
      return res.redirect("/login");
    }
    return next();
  }
  res.redirect("/login");
}

function isValidEmail(email) {
  //regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = router;
