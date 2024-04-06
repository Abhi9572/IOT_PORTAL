require("dotenv").config();
const localStrategy = require("passport-local");
const passport = require("passport");
const userModel = require("../models/users");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const mqttController = require("../controllers/MqttController");


const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_AUTH_USER,
    pass: process.env.MAIL_AUTH_PASS,
  },
});

async function register(req, res) {
  const { username, email, password } = req.body;
  console.log(username, email, password);

  // Check if all required fields are filled
  if (!username || !email || !password) {
    req.flash("error", "Please fill in all required fields. ");
    return res.redirect("/");
  }

  try {
    // Check if the email is valid
    if (!isValidEmail(email)) {
      req.flash("error", "Please provide a valid email address. ");
      return res.redirect("/");
    }

    // Check if the email is already registered
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
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

    // Generate a verification token
    const verificationToken = uuidv4();

    // Save the verification token in the user's document
    userData.verificationToken = verificationToken;

    //Register user with passport-local-mongoose
    await userModel.register(userData, req.body.password);

    // Send verification email
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
        res.render("success", { user: userData });
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
}

function isValidEmail(email) {
  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function success(req, res) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      console.error("User not found.");
      req.flash("error", "User not found.");
      return res.redirect("/");
    }
    //res.render('success', {user:user});
  } catch (error) {
    console.error("Error fetching user :", error);
    res.render("error", { message: "Error fetching user" });
  }
}

async function verifyEmail(req, res) {
  try {
    const token = req.params.token;
    console.log(token);

    // Update user's verification status to true in the database
    const updateResult = await userModel.updateOne(
      { verificationToken: token },
      { $set: { isVerified: true } }
    );

    console.log(updateResult);

    if (updateResult.nModified === 0) {
      // If no user is updated (no matching verification token), handle the error
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
    // Handle any error that occurs during the process
    console.error("Error verifying email:", error);
    req.flash(
      "error",
      "An error occured during email verification.Please try again later."
    );
    return res.redirect("/login");
  }
}

function login(req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      req.flash("error", err.message); // Flash error message
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message); // Flash error message
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        req.flash("error", err.message); // Flash error message
        return next(err);
      }
      if (!user.isVerified) {
        // Handle email verification logic here
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
}

function logout(req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/login");
  });
}

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

module.exports = { register, verifyEmail, login, logout, isLoggedIn, success };
