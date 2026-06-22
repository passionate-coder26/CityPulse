# 🏙️ CityPulse AI (Node.js + React + Edge AI)

## 📝 Project Overview
**CityPulse AI** is a hybrid Edge-to-Cloud urban infrastructure monitoring system. 
This backend handles real-time data ingestion from Edge AI nodes (Python/TensorFlow) and Citizen Apps, stores telemetry in the cloud, and utilizes **Google Gemini 2.5 Flash** to generate autonomous, proactive maintenance reports.

## ✅ System Status: 🟢 CLOUD PRODUCTION ACTIVE
- **Live Server URL:** `https://citypulse-1-bjum.onrender.com`
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **AI Service:** Google Gemini 2.5 Flash
- **Local Dev Port:** `5000`

---

## 🏗️ Architecture Highlights
* **Predictive Maintenance:** Monitors time-series "heartbeats" of IoT hardware (CCTVs, Streetlights) to detect silent failures before citizens report them.
* **Optimized LLM Processing:** Backend strips heavy Base64 image payloads before querying Gemini, bypassing token limits and ensuring lightning-fast AI report generation.
* **Unified REST API:** Serves as the central nervous system connecting the React Frontend, Edge Python scripts, and the Cloud DB.

---

## 🔑 Local Setup Instructions (For Teammates & Judges)

**Step 1: Install Node Dependencies (Backend & Frontend)**

    npm install
    cd frontend
    npm install
    cd ..

**Step 2: Install Python ML Dependencies (Edge AI)**

    pip install -r requirements.txt

**Step 3: Configure Environment Variables**
Create a file named `.env` in the root folder. Ask Abhiram for the actual keys and paste them like this:

    GEMINI_API_KEY=your_gemini_key_here
    MONGO_URI=your_mongodb_atlas_connection_string
    GOOGLE_MAPS_API_KEY=your_google_maps_key_here

**Step 4: Start the Full Stack System**
You will need two separate terminal windows to run all components:

    # Terminal 1: Start the Backend
    node server.js
    
    # Terminal 2: Start the React Frontend
    cd frontend
    npm run dev
    

---

## 📡 Core API Endpoints

### 1. Get Live Sector Telemetry
* **Method:** `GET`
* **URL:** `/api/detections`
* **Description:** Fetches all active incident reports (potholes, garbage, water logging) along with their severity rankings and GPS coordinates.

### 2. Ingest Edge/Citizen Data
* **Method:** `POST`
* **URL:** `/api/detections`
* **Body:** JSON object containing `type`, `severity`, `lat`, `lng`, `confidence`, and `source` (AI or Citizen).
* **Description:** Receives real-time bounding box data from the YOLOv8 camera nodes or manual reports from the Citizen Portal.

### 3. Predictive Infrastructure AI (Silent Failures)
* **Method:** `GET`
* **URL:** `/api/infrastructure/anomalies`
* **Description:** Analyzes heartbeat ping timestamps from city IoT devices to calculate mathematical failure probabilities for unreported offline assets.

### 4. Autonomous Grid Evaluation
* **Method:** `POST`
* **URL:** `/api/generate-report`
* **Description:** Triggers the backend to fetch the latest unhandled incidents from MongoDB, formats them into a lightweight JSON payload, and queries Google Gemini for an executive maintenance summary.

---

## ⚠️ Known Issues / Dev Notes
* **Google Maps Watermark:** You may see a "For Development Purposes Only" watermark on the React frontend map. This is expected (Developer Mode) and the map is still fully functional.
* **Cold Starts:** If the Render web service has not been pinged in 15 minutes, the first API request may take up to 50 seconds to resolve while the backend boots up. Subsequent requests will be instantaneous.
