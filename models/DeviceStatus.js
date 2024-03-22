const { mongoose } = require("../mongoose");

const deviceStatusSchema = new mongoose.Schema({
  deviceId: String,
  devicePrimaryId: String,
  userId: String,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DeviceStatus", deviceStatusSchema);
