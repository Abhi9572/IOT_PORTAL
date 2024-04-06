require("dotenv").config();
const express = require("express");
const router = express.Router();

const bodyParser = require("body-parser");
const userModel = require("../models/users");
const passport = require("passport");
const localStrategy = require("passport-local");
const dashboardController = require("../controllers/dashboardController");
const deviceListController = require("../controllers/deviceListController");
const userController = require("../controllers/userController");
const { isLoggedIn } = require("../controllers/userController");
const activityController = require("../controllers/activityController");
const activityDownloadController = require("../controllers/activityDownloadController");
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

router.get("/success", userController.success);

router.get("/login", function (req, res) {
  res.render("login", { error: req.flash("error") });
});

router.get("/dashboard", isLoggedIn, dashboardController.dashboard);

router.get("/devicelist", isLoggedIn, deviceListController.getDeviceList);

router.get("/editDevice/:id", isLoggedIn, editDeviceController.editDeviceForm);

router.post(
  "/editDevice/:id/update",
  isLoggedIn,
  editDeviceController.updateDevice
);

router.post(
  "/deleteDevice/:id",
  isLoggedIn,
  deleteDeviceController.deleteDevice
);

router.get("/:deviceId/activity", isLoggedIn, activityController.getActivity);

// // Route handler for downloading activity data in Excel format
router.get(
  "/:deviceId/activity/download",
  isLoggedIn,
  activityDownloadController.downloadActivity
);

router.get("/adddevice", isLoggedIn, addDeviceController.showAddDevice);

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
router.post("/toggleDevice", deviceListController.updateStatus);

router.post("/register", userController.register);

router.get("/verify-email/:token", userController.verifyEmail);

router.post("/login", userController.login);

router.get("/logout", userController.logout);

module.exports = router;
