const { mongoose } = require("../mongoose");

const plm = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  verificationToken: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  devices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
    },
  ],
});

//specify options for passport-local-mongoose
const plmOptions = {
  usernameField: "username",
  passwordField: "password",
};

userSchema.plugin(plm, plmOptions);

module.exports = mongoose.model("User", userSchema);
