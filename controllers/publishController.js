// require("dotenv").config();
// const mqtt = require("mqtt");
// const Device = require("../models/devices");
// const DeviceStatus = require("../models/DeviceStatus");

// const mqtt_broker = process.env.MQTT_BROKER;
// const settings = {
//   keepalive: parseInt(process.env.MQTT_KEEPALIVE_TIME),
//   protocol: process.env.MQTT_PROTOCOL,
//   username: process.env.MQTT_USERNAME,
//   password: process.env.MQTT_PASSWORD,
// };

// // Function to publish MQTT message and save data
// exports.publishMQTTMessageAndSaveData = async function (req, res) {
//   try {
//     const topic = req.body.topic;
//     const message = req.body.message;

//     // Log the received topic and message
//     console.log(`Request Topic :: ${topic}`);
//     console.log(`Request Message :: ${message}`);

//     // Save data to DeviceStatus collection
//     const deviceStatus = new DeviceStatus({
//       deviceId: topic,
//       status: message,
//     });
//     await deviceStatus.save();

//     // Establish connection to MQTT broker
//     const mqttClient = mqtt.connect(mqtt_broker, settings);

//     // Publish the message
//     mqttClient.publish(topic, message, {});

//     // Close the MQTT client connection
//     mqttClient.end();

//     // Send success response
//     res.status(200).json({ status: "200", message: "Successfully published MQTT Message and saved data" });
//   } catch (error) {
//     // Send error response
//     return res.status(400).json({ status: 400, message: error.message });
//   }
// };
