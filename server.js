require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(cors());
app.use(express.json()); 

// Ensure the data directory exists
const DATA_DIR = path.join(__dirname, 'public/data');
if (!fs.existsSync(DATA_DIR)){
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DATA_FILE = path.join(DATA_DIR, 'mock_detections.json');

// Helper: Read Data safely
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading data:", e.message);
        return [];
    }
};

// Helper: Write Data safely
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error writing data:", e.message);
    }
};


// ================= API ROUTES =================

// 1. GET: Fetch All Detections
app.get('/api/detections', (req, res) => {
    const data = readData();
    res.json(data);
});

// 2. POST: Receive Live Data from Python 
app.post('/api/detections', (req, res) => {
    const newData = {
        ...req.body,
        id: req.body.id || Date.now(), // Ensure ID exists
        status: 'Open',                // Default status
        timestamp: req.body.client_timestamp || new Date().toISOString()
    };
    
    console.log(`📸 Received: ${newData.type} (${newData.severity})`);

    const currentData = readData();
    
    // Add new detection to the top
    currentData.unshift(newData);

    // Keep file size small (last 50 items)
    if (currentData.length > 50) currentData.splice(50);

    writeData(currentData);
    res.json({ success: true, id: newData.id });
});

// 3. PATCH: Mark Issue as Resolved (THE NEW FEATURE)
app.patch('/api/detections/:id/resolve', (req, res) => {
    const { id } = req.params;
    let currentData = readData();

    // Find and Update
    const issueIndex = currentData.findIndex(d => d.id == id); // '==' matches string vs number IDs
    
    if (issueIndex !== -1) {
        currentData[issueIndex].status = 'Resolved';
        currentData[issueIndex].severity = 'Low'; // Downgrade severity
        
        writeData(currentData); // Save to file
        
        console.log(`✅ Issue ${id} marked as RESOLVED.`);
        res.json({ success: true, issue: currentData[issueIndex] });
    } else {
        res.status(404).json({ error: "Issue not found" });
    }
});

// 4. POST: Generate Gemini Report
app.post('/api/generate-report', async (req, res) => {
    const { detections } = req.body;
    console.log("🤖 Generating report for", detections ? detections.length : 0, "issues...");

    try {
        // Filter only active issues for the report
        const activeIssues = detections.filter(d => d.status !== 'Resolved');

        const prompt = `
            Act as a Senior City Engineer. 
            Analyze this raw detection data of active city issues: ${JSON.stringify(activeIssues.slice(0, 15))}.
            1. Identify the most critical risk area based on coordinates and severity.
            2. Write a 3-bullet action plan for the maintenance team.
            3. Keep it professional and urgent.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        res.json({ report: text });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "AI Service Unavailable" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 CitySense Backend running at http://localhost:${PORT}`);
    console.log(`📂 Data File: ${DATA_FILE}`);
});