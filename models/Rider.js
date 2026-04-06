const mongoose = require("mongoose");

const RiderSchema = new mongoose.Schema({
    name: String,
    phone: String,
    vehicle: String,
    status: { type: String, default: "offline" },
    location: {
        lat: Number,
        lng: Number
    },
    lastUpdate: Date
});

module.exports = mongoose.model("Rider", RiderSchema);
