const mongoose = require("mongoose");

const transporterSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    truckType: { type: String, required: true },
    capacity: { type: Number, required: true }, // in kg
    location: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ["AVAILABLE", "BUSY", "OFFLINE"],
        default: "AVAILABLE"
    },
    token: { type: String } // For potential auth/session tracking
}, { timestamps: true });

module.exports = mongoose.model("Transporter", transporterSchema);
