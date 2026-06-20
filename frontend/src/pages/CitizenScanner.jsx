import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import { Link } from "react-router-dom";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

export default function CitizenScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastReportTime = useRef(0);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Real-time clock for HUD
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. LOAD THE EDGE AI MODEL
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("Loading AI Model from local cache...");
        // This path points directly to your public folder!
        const loadedModel = await tf.loadGraphModel("/models/pothole_best_web_model/model.json");
        setModel(loadedModel);
        setLoading(false);
        console.log("✅ AI Model Loaded Successfully!");
      } catch (err) {
        console.error("❌ Failed to load model:", err);
      }
    };
    loadModel();
  }, []);

  // 2. REAL-TIME VIDEO PROCESSING LOOP
  const detectFrame = async () => {
    if (!model || !webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4) {
      requestAnimationFrame(detectFrame);
      return;
    }

    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Match canvas to video size
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    const ctx = canvasRef.current.getContext("2d");

    // Clear previous drawings
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // --- AI INFERENCE (THE HEAVY LIFTING) ---
    tf.engine().startScope(); // Prevent memory leaks
    
    // Convert video frame to Tensor and resize to YOLOv8 standard 640x640
    const input = tf.browser.fromPixels(video)
      .resizeBilinear([640, 640])
      .div(255.0)
      .expandDims(0);

    // Run the model
    const res = await model.executeAsync(input);
    
    // YOLOv8 exports as [1, 5, 8400] for 1 class (x, y, w, h, confidence)
    const data = res.dataSync(); 
    const numBoxes = 8400;

    let bestConf = 0;
    let bestBox = null;

    // Find the bounding box with the highest confidence
    for (let i = 0; i < numBoxes; i++) {
      const conf = data[4 * numBoxes + i]; // 5th row is confidence
      if (conf > 0.65 && conf > bestConf) {
        bestConf = conf;
        const cx = data[0 * numBoxes + i];
        const cy = data[1 * numBoxes + i];
        const w = data[2 * numBoxes + i];
        const h = data[3 * numBoxes + i];
        bestBox = { cx, cy, w, h };
      }
    }

    // --- DRAWING & REPORTING ---
    if (bestBox) {
      // Scale coordinates back to actual video size
      const x = (bestBox.cx - bestBox.w / 2) * (videoWidth / 640);
      const y = (bestBox.cy - bestBox.h / 2) * (videoHeight / 640);
      const width = bestBox.w * (videoWidth / 640);
      const height = bestBox.h * (videoHeight / 640);

      // Draw Red Bounding Box (Premium glowing stroke)
      ctx.strokeStyle = "#3b82f6";
      ctx.shadowColor = "#2563eb";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw Label Background
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(x, y - 32, 160, 32);
      
      // Reset shadows for text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px 'JetBrains Mono', monospace";
      ctx.fillText(`Pothole: ${(bestConf * 100).toFixed(1)}%`, x + 10, y - 10);

      // Report to Backend (Throttled to once every 5 seconds)
      const now = Date.now();
      if (now - lastReportTime.current > 5000) {
        lastReportTime.current = now;
        reportToBackend(bestConf);
      }
    }

    tf.engine().endScope(); // Clear memory for the next frame
    requestAnimationFrame(detectFrame); // Loop infinitely
  };

  // Start loop when model is ready
  useEffect(() => {
    if (!loading) {
      detectFrame();
    }
  }, [loading]);

  // 3. SEND DATA TO DATABASE
  const reportToBackend = async (confidence) => {
    try {
      const payload = {
        type: "Pothole",
        severity: confidence > 0.85 ? "High" : "Medium",
        lat: 19.0760 + (Math.random() * 0.01), // Simulating user's GPS
        lng: 72.8777 + (Math.random() * 0.01),
        confidence: Number(confidence.toFixed(2)),
        client_timestamp: new Date().toISOString(),
        source: "citizen",
      };

      await fetch(`${API_BASE}/api/detections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log("📲 Pothole reported to backend!");
    } catch (err) {
      console.error("Failed to report:", err);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f0f4f8] cs-grid-bg pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* HEADER NAV */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/citizen" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-all text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Citizen Dashboard
          </Link>
          
          <div className="flex items-center gap-2.5">
            <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              </svg>
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800">
              City<span className="text-blue-600">Sense</span> <span className="text-slate-400 font-medium text-[10px]">Scanner</span>
            </span>
          </div>

          <div className="text-slate-400 text-xs font-semibold cs-mono">{time}</div>
        </div>
      </header>

      {/* SCANNER CONTAINER */}
      <main className="flex-1 max-w-lg w-full px-6 flex flex-col justify-center items-center mt-6 cs-animate-in">
        
        {/* TITLE */}
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3.5 py-1 rounded-full text-xs font-extrabold shadow-sm tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            EDGE AI COMPUTER VISION ACTIVE
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 mt-2">
            AR Road Surface Scanner
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Point camera at road surfaces to detect and catalog pavement hazards.
          </p>
        </div>

        {/* WEB FEED SCREEN WINDOW */}
        <div className="relative w-full aspect-[3/4] sm:aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-blue-500/10 cs-scanline">
          
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                <div className="w-6 h-6 rounded-full border-4 border-sky-400 border-b-transparent animate-spin absolute"></div>
              </div>
              <p className="font-bold text-slate-700 text-sm mt-4 tracking-wide">Initializing TensorFlow AI Engine...</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold cs-mono">Loading YOLOv8 Graph Model (12MB)</p>
            </div>
          )}

          {/* HUD OVERLAY TELEMETRY */}
          <div className="absolute inset-x-0 top-0 z-20 p-4 bg-gradient-to-b from-black/55 to-transparent text-white flex justify-between items-start font-mono text-[10px] tracking-wide pointer-events-none">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE STREAMING
              </span>
              <span className="text-white/60">NODE: ENG_GRID_42</span>
            </div>
            <div className="text-right flex flex-col gap-0.5">
              <span>CAMERA: DEFAULT_ENV</span>
              <span className="text-white/60">FPS: 30 (STABLE)</span>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/55 to-transparent text-white font-mono text-[10px] tracking-wide pointer-events-none flex justify-between items-end">
            <div className="flex flex-col gap-0.5">
              <span>ENGINE: WebGL 2.0</span>
              <span className="text-white/60">SEVERITY THRESHOLD: &gt;65%</span>
            </div>
            <span className="font-bold text-sky-400 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded">
              YOLOv8-Edge
            </span>
          </div>

          {/* SCAN LINE ANIMATION EFFECT */}
          <div 
            className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-10 pointer-events-none opacity-40"
            style={{
              animation: "scanline 3.5s linear infinite",
              boxShadow: "0 0 10px #2563eb, 0 0 20px #38bdf8"
            }}
          ></div>

          {/* The Live Camera Feed */}
          <Webcam
            ref={webcamRef}
            muted={true}
            videoConstraints={{ facingMode: "environment" }} // Forces the back camera on mobile
            className="w-full h-full object-cover"
          />

          {/* The Transparent Overlay for AI Boxes */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          />
        </div>

        {/* SCORING RULES / GUIDELINES */}
        <div className="bg-white/80 border border-slate-200/50 backdrop-blur-md rounded-2xl p-5 shadow-sm mt-6 w-full text-xs space-y-2">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            💡 SCANNER INSTRUCTIONS
          </h4>
          <p className="text-slate-500 font-medium leading-relaxed">
            Hold your device steady, looking forward at the road segment. The edge machine learning algorithm automatically analyzes every frame to localize structural pothole cracking and automatically transmits geolocated telemetric logs to city maintenance.
          </p>
        </div>

      </main>
    </div>
  );
}