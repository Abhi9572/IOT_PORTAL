require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    // console.log('Connected to MongoDB');
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

module.exports = { connectToMongoDB, mongoose };
