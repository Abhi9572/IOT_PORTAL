require("dotenv").config();
const mqtt = require("mqtt");
const Device = require("../models/devices");
const DeviceStatus = require("../models/DeviceStatus");

const mqtt_broker = process.env.MQTT_BROKER;
//const mqtt_topic = 'home/firstFloor/#'; // Use '#' to subscribe to all topics

const settings = {
  keepalive: parseInt(process.env.MQTT_KEEPALIVE_TIME),
  protocol: process.env.MQTT_PROTOCOL,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

//let subscribedTopics = []; // Array to store subscribed topics

module.exports = {
  init: function (user) {
    const client = mqtt.connect(mqtt_broker, settings);

    // Subscribe to topics when connected
    client.on("connect", async function () {
      console.log("Connected to MQTT broker");
      try {
        // Fetch devices belonging to the current user from the database
        const devices = await Device.find({ user: user._id }, "deviceId");
        console.log(devices);

        // Subscribe to each device's topic
        devices.forEach((device) => {
          client.subscribe(device.deviceId);
          console.log(`Subscribed to topic ${device.deviceId}`);
        });
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    });

    // Event handler for incoming messages
    client.on("message", async function (topic, message) {
      try {
        // Parse the received message
        const payload = JSON.parse(message.toString());

        // Validate the message format
        if (isValidMessageFormat(payload)) {
          // Extract the necessary information from the payload
          const deviceId = payload.deviceId;
          const command = payload.command;

          // Check if deviceId and command are valid
          if (deviceId && command) {
            // Check if the topic corresponds to a device of the user
            const device = await Device.findOne({ deviceId, user: user._id });
            console.log(device);

            if (device && topic === device.deviceId) {
              const deviceStatus = new DeviceStatus({
                deviceId: deviceId,
                devicePrimaryId: device._id,
                userId: device.user,
                status: command,
              });
              console.log(deviceStatus);

              // Save the DeviceStatus document to the database
              await deviceStatus.save();
              console.log(
                `Device status saved for deviceId ${deviceId}: ${command}`
              );
            } else {
              console.log(
                `Error: Device with deviceId ${deviceId} not found or topic does not match.`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    // Function to validate the message format
    function isValidMessageFormat(payload) {
      // Perform validation according to your expected format
      // For example, check if the payload contains required keys or has the expected structure
      return (
        payload &&
        typeof payload.deviceId === "string" &&
        typeof payload.command === "string"
      );
    }
  },
};
