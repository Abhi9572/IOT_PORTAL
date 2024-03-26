const { mongoose } = require("../mongoose");

const deviceStatusSchema = new mongoose.Schema({
  deviceId: String,
  devicePrimaryId: String,
  userId: String,
  status: String,
  createdAt: {
    type: Date,
    default: () => {
      // Get current UTC time
      const currentDate = new Date();
      // Adjust to IST (UTC +5 hours 30 minutes)
      currentDate.setUTCHours(currentDate.getUTCHours() + 5);
      currentDate.setUTCMinutes(currentDate.getUTCMinutes() + 30);
      return currentDate;
    }
  },
});

module.exports = mongoose.model("DeviceStatus", deviceStatusSchema);
