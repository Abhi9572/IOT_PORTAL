const { mongoose } = require("../mongoose");

const addDeviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  statusDevice: {
    type: String,
    default: 'off' // Set default value to 'off'
},
});

module.exports = mongoose.model("Device", addDeviceSchema);
