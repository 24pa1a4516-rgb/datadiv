const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  farmerId: { type: String, required: true }, // Changed to String for prototype
  crop: String,
  quantity: Number,
  location: String,
  status: {
    type: String,
    default: "PENDING" // PENDING | ACCEPTED
  },
  transporterId: {
    type: String, // Changed to String for prototype
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("Request", requestSchema);
