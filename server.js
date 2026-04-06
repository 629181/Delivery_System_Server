require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const Rider = require("./models/Rider");
const Activity = require("./models/Activity");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://NextGen:%23Radon690@cluster0.wzzolu6.mongodb.net/SCADA_DB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* Register Rider */
app.post("/api/register", async (req, res) => {
    const rider = new Rider(req.body);
    await rider.save();
    res.json(rider);
});

/* Update Location */
app.post("/api/update-location", async (req, res) => {
    const { riderId, lat, lng } = req.body;

    const rider = await Rider.findByIdAndUpdate(
        riderId,
        {
            location: { lat, lng },
            status: "active",
            lastUpdate: new Date()
        },
        { new: true }
    );

    await new Activity({
        riderId,
        message: "Location updated"
    }).save();

    io.emit("locationUpdated", rider);
    res.json({ success: true });
});
/* Update Delivery Status */
app.post("/api/update-status", async (req, res) => {
    const { riderId, status } = req.body;

    try {
        const rider = await Rider.findByIdAndUpdate(
            riderId,
            { status: status },
            { new: true }
        );

        // Log the status change in Activity collection
        await new Activity({
            riderId,
            message: `Status updated: ${status}`,
            time: new Date()
        }).save();

        // Broadcast the update to the Admin App
        io.emit("statusUpdated", rider);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/* Get All Riders */
app.get("/api/riders", async (req, res) => {
    const riders = await Rider.find();
    res.json(riders);
});

/* Get Activity */
app.get("/api/activity/:id", async (req, res) => {
    const logs = await Activity.find({ riderId: req.params.id }).sort({ time: -1 });
    res.json(logs);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`Server running at port ${PORT}`)
);
