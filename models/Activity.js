const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
    riderId: mongoose.Schema.Types.ObjectId,
    message: String,
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Activity", ActivitySchema);