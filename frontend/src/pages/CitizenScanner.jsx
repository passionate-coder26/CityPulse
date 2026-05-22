import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000" : "https://citysenseai.onrender.com";

export default function CitizenScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastReportTime = useRef(0);

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

      // Draw Red Bounding Box
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw Label
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(x, y - 30, 140, 30);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "20px Arial";
      ctx.fillText(`Pothole: ${(bestConf * 100).toFixed(1)}%`, x + 5, y - 10);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold">📱 Citizen AR Scanner</h1>
        <p className="text-gray-400">Point your camera at a road surface</p>
      </div>

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-4 border-gray-700 shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></span>
            <p className="font-mono text-blue-400 animate-pulse">Loading AI Engine...</p>
          </div>
        )}

        {/* The Live Camera Feed */}
        <Webcam
          ref={webcamRef}
          muted={true}
          videoConstraints={{ facingMode: "environment" }} // Forces the back camera on mobile
          className="w-full h-auto object-cover"
        />

        {/* The Transparent Overlay for AI Boxes */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
    </div>
  );
}