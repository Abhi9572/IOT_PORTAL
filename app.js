require("dotenv").config();
const express = require("express");
const createError = require("http-errors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressSession = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const { connectToMongoDB } = require("./mongoose");
const indexRouter = require("./routes/index");
const User = require("./models/users");
const Device = require("./models/devices");

const forgotPassword = require("./routes/forgot-password");
const DeviceStatus = require("./models/DeviceStatus");

const app = express();

const mqttController = require("./controllers/MqttController");
//const deviceStatusController = require('./controllers/deviceStatusController');

// Connect to MongoDB
connectToMongoDB().then(() => {
  // Start MQTT controller
  // mqttController.init();
});

//view engine setup
app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "some_template_engine_name");
app.set("view engine", "ejs");

app.use(flash());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "Secret key",
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// passport.use(new localStrategy(User.authenticate()));

passport.use(
  new localStrategy(
    {
      usernameField: "username", // Specify the field for username or email
      passwordField: "password", // Specify the field for password
    },
    function (username, password, done) {
      // Find the user by username or email
      User.findOne({ $or: [{ username: username }, { email: username }] })
        .then((user) => {
          if (!user) {
            return done(null, false, {
              message: "Incorrect username or email.",
            });
          }
          // Use Mongoose's built-in method to authenticate the user
          user
            .authenticate(password)
            .then((isMatch) => {
              if (!isMatch) {
                return done(null, false, { message: "Incorrect password." });
              }
              return done(null, user);
            })
            .catch((err) => done(err));
        })
        .catch((err) => done(err));
    }
  )
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/", forgotPassword);
app.use("/", User);
app.use("/", Device);
app.use("/", DeviceStatus);

app.use(function (req, res, next) {
  next(createError(404));
});

//error handler
app.use(function (err, req, res, next) {
  //set locals, only providing in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  //render the error page
  res.status(err.status || 500);
  console.log(err.message);
  res.render("error");
});

app.listen(process.env.PORT, () => {
  console.log(`Successfully running on port ${process.env.PORT}`);
});

module.exports = app;
