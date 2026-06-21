require('dotenv').config();
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ================= 1. MONGODB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas Cloud Database!"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// ================= 2. DATABASE SCHEMA =================
const detectionSchema = new mongoose.Schema({
    type: String,
    severity: String,
    lat: Number,
    lng: Number,
    status: { type: String, default: 'Open' },
    detection_count: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now },
    image_url: String,
    confidence: Number
});

detectionSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

const Detection = mongoose.model('Detection', detectionSchema);

// Helper: Haversine distance formula (returns distance in meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ================= 3. API ROUTES =================

// GET: Fetch All Detections
app.get('/api/detections', async (req, res) => {
    try {
        const { status, include_pending } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        } else if (include_pending === 'true') {
            query = {};
        } else {
            // Filter out 'Pending_Verification' items by default so they do not appear on the map until approved
            query.status = { $ne: 'Pending_Verification' };
        }

        // Fetch from MongoDB, sort newest first, limit to keep map fast
        const data = await Detection.find(query).sort({ timestamp: -1 }).limit(100);
        res.json(data);
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch from Database" });
    }
});

// POST: Receive Live Data from Python (Intelligent Clustering)
app.post('/api/detections', async (req, res) => {
    const { type, lat, lng, severity, image_url, client_timestamp, confidence, source } = req.body;
    const detectionTime = client_timestamp || new Date();

    console.log(`📸 Received: ${type} (${severity}) from source: ${source || 'automated'} at lat: ${lat}, lng: ${lng}`);

    try {
        // Find active issues for clustering
        const activeIssues = await Detection.find({ status: { $ne: 'Resolved' } });

        let clusteredIssue = null;
        if (lat && lng) {
            clusteredIssue = activeIssues.find(d =>
                d.type.toLowerCase() === type.toLowerCase() &&
                getDistance(d.lat, d.lng, parseFloat(lat), parseFloat(lng)) <= 10
            );
        }

        if (clusteredIssue) {
            let newCount = (clusteredIssue.detection_count || 1) + 1;
            let newSeverity = clusteredIssue.severity;

            // Dynamic Severity Upgrades
            if (newCount >= 10) newSeverity = 'Critical';
            else if (newCount >= 3) newSeverity = 'High';

            // Update in MongoDB
            await Detection.findByIdAndUpdate(clusteredIssue._id, {
                detection_count: newCount,
                severity: newSeverity,
                timestamp: detectionTime,
                image_url: image_url || clusteredIssue.image_url
            });

            console.log(`♻️ [Clustered DB] Incremented sightings for ${type} to ${newCount}. New Severity: ${newSeverity}`);
            res.json({ success: true, id: clusteredIssue._id, clustered: true });

        } else {
            // Create brand new record in MongoDB
            // Source 'citizen' defaults to 'Pending_Verification'. Others (python_streamer, automated) default to 'Open'.
            const newIssue = new Detection({
                type,
                severity: severity || 'Medium',
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                status: source === 'citizen' ? 'Pending_Verification' : 'Open',
                detection_count: 1,
                timestamp: detectionTime,
                image_url: image_url || 'https://via.placeholder.com/150?text=Live+Detection',
                confidence: confidence || 1.0
            });

            const savedIssue = await newIssue.save();
            console.log(`🆕 [New Issue DB] Created ${newIssue.type} with status ${newIssue.status} and severity ${newIssue.severity}`);
            res.json({ success: true, id: savedIssue._id, clustered: false });
        }
    } catch (err) {
        console.error("DB Write Error:", err);
        res.status(500).json({ error: "Failed to write to Database" });
    }
});

// PATCH: Mark Issue as Resolved
app.patch('/api/detections/:id/resolve', async (req, res) => {
    const { id } = req.params;

    try {
        await Detection.findByIdAndUpdate(id, {
            status: 'Resolved',
            severity: 'Low'
        });

        console.log(`✅ Issue ${id} marked as RESOLVED in Database.`);
        res.json({ success: true });
    } catch (err) {
        console.error("Resolve Error:", err);
        res.status(500).json({ error: "Failed to resolve issue" });
    }
});

// PATCH: Approve Pending Sighting (Admin Route)
app.patch('/api/detections/:id/approve', async (req, res) => {
    const { id } = req.params;

    try {
        const approvedIssue = await Detection.findByIdAndUpdate(id, {
            status: 'Open'
        }, { new: true });

        console.log(`✅ Sighting ${id} APPROVED and marked as Open.`);
        res.json({ success: true, issue: approvedIssue });
    } catch (err) {
        console.error("Approve Error:", err);
        res.status(500).json({ error: "Failed to approve sighting" });
    }
});

// ========================================================
// 5. SILENT INFRASTRUCTURE FAILURE DETECTOR (PREDICTIVE AI)
// ========================================================
app.get('/api/infrastructure/anomalies', async (req, res) => {
    try {
        // In production, this would query a MongoDB collection of your city assets.
        // For the presentation demo, we use live-calculated time-series telemetry:
        const currentTimestamp = Date.now();

        const infrastructureAssets = [
            {
                id: "CCTV-DOWNTOWN-12",
                type: "Traffic CCTV Node",
                sector: "Downtown",
                last_ping: currentTimestamp - (1000 * 60 * 4), // 4 mins ago
                expected_interval_mins: 5
            },
            {
                id: "SL-NORTH-Q-44",
                type: "Smart Streetlight",
                sector: "North Quarter",
                last_ping: currentTimestamp - (1000 * 60 * 48), // 48 mins ago (Missed 3+ pings)
                expected_interval_mins: 15
            },
            {
                id: "SOS-WEST-09",
                type: "Emergency Call Box",
                sector: "West Side",
                last_ping: currentTimestamp - (1000 * 60 * 60 * 7), // 7 hours ago (Missed severely)
                expected_interval_mins: 60
            },
            {
                id: "SL-EAST-102",
                type: "Smart Streetlight",
                sector: "East District",
                last_ping: currentTimestamp - (1000 * 60 * 11), // 11 mins ago
                expected_interval_mins: 15
            }
        ];

        // Process heartbeats and run anomaly detection logic
        const detectedAnomalies = infrastructureAssets.map(asset => {
            const minutesOffline = Math.round((currentTimestamp - asset.last_ping) / (1000 * 60));
            const missedHeartbeats = Math.floor(minutesOffline / asset.expected_interval_mins);

            let riskStatus = "Optimal";
            let failureProbability = 0;

            // Anomaly logic: If a device misses more than 2 consecutive pings, flag it
            if (missedHeartbeats >= 2) {
                riskStatus = missedHeartbeats >= 5 ? "Critical Failure" : "Suspected Anomaly";
                // Exponential risk curve scaling up to 99%
                failureProbability = Math.min(Math.round((missedHeartbeats / 6) * 100), 99);
            }

            return {
                id: asset.id,
                type: asset.type,
                sector: asset.sector,
                minutesOffline,
                missedHeartbeats,
                riskStatus,
                failureProbability
            };
        }).filter(asset => asset.failureProbability > 0); // Only return flagged assets to dashboard

        // Sort by highest risk priority
        detectedAnomalies.sort((a, b) => b.failureProbability - a.failureProbability);

        res.json(detectedAnomalies);
    } catch (err) {
        console.error("Anomaly route error:", err);
        res.status(500).json({ error: "Predictive engine runtime failure" });
    }
});

// POST: Generate Gemini Report
app.post('/api/generate-report', async (req, res) => {
    try {
        // Fetch only active issues for the AI to analyze
        const activeIssues = await Detection.find({ status: { $ne: 'Resolved' } }).limit(15);

        console.log("🤖 Generating report for", activeIssues.length, "active issues...");

        const prompt = `
            Act as a Senior City Engineer. 
            Analyze this raw detection data of active city issues: ${JSON.stringify(activeIssues)}.
            1. Identify the most critical risk area based on coordinates and severity.
            2. Write a 3-bullet action plan for the maintenance team.
            3. Keep it professional and urgent.
        `;

        const result = await model.generateContent(prompt);
        res.json({ report: result.response.text() });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "AI Service Unavailable" });
    }
});
const fs = require('fs');
const path = require('path');

const server = app.listen(PORT, () => {
    console.log(`🚀 CityPulse Backend running on port ${PORT}`);

    // Dynamically locate the python executable in venv
    let pythonCmd = 'python';
    const windowsVenvPath = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
    const unixVenvPath = path.join(__dirname, 'venv', 'bin', 'python');

    if (fs.existsSync(windowsVenvPath)) {
        pythonCmd = windowsVenvPath;
        console.log(`🐍 Spawning python from Windows virtual environment: ${pythonCmd}`);
    } else if (fs.existsSync(unixVenvPath)) {
        pythonCmd = unixVenvPath;
        console.log(`🐍 Spawning python from Unix/Linux virtual environment: ${pythonCmd}`);
    } else {
        console.log(`⚠️ Virtual environment python not found, falling back to global: ${pythonCmd}`);
    }

    // Spawn the Python streamer
    const pythonProcess = spawn(pythonCmd, ['stream_camera.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python Streamer]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Streamer Error]: ${data}`);
    });
});
