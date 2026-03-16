import cv2
import requests
import time
import datetime
import random

# ==========================================
# 1. CONFIGURATION
# ==========================================
# Your Node.js Backend URL
LOCAL_BACKEND_URL = "http://localhost:5000/api/detections"

# Virtual Patrol Video
VIDEO_FILE = "road_patrol.mp4" 

# Base GPS (Mumbai Coordinates)
LAT_BASE = 19.0760
LNG_BASE = 72.8777

# Simulation Settings
SEND_COOLDOWN = 4       # Send an alert every 4 seconds (approx)
CONFIDENCE_MIN = 0.75   # Fake confidence score min
CONFIDENCE_MAX = 0.98   # Fake confidence score max

# ==========================================
# MAIN LOOP
# ==========================================
print(f"🔄 Loading Virtual Patrol Video: {VIDEO_FILE}...")
cap = cv2.VideoCapture(VIDEO_FILE)

if not cap.isOpened():
    print(f"❌ Error: Could not open video {VIDEO_FILE}")
    exit()

print("📸 Virtual Patrol Started. System is 'scanning' for potholes...")
print("Press 'Q' to quit.")

last_sent_time = time.time()

while True:
    ret, frame = cap.read()
    
    # Loop Video if ended
    if not ret:
        print("🔁 Video ended. Restarting loop...")
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    # 1. Add some "AI HUD" text to the video so it looks real
    cv2.putText(frame, "AI SCANNING: ACTIVE", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("CitySense - Live Patrol", frame)

    current_time = time.time()

    # 2. TRIGGER A FAKE ALERT (Every ~4 seconds)
    if current_time - last_sent_time > SEND_COOLDOWN:
        
        # Randomly choose what we "detected"
        detection_type = random.choice(["Pothole", "Pothole", "Garbage Dump"]) # Higher chance of Pothole
        severity = "High" if detection_type == "Pothole" else "Medium"
        confidence = round(random.uniform(CONFIDENCE_MIN, CONFIDENCE_MAX), 2)
        
        # Prepare the data payload
        payload = {
            "type": detection_type,
            "severity": severity,
            # Randomize GPS slightly so markers don't stack on top of each other
            "lat": LAT_BASE + random.uniform(-0.005, 0.005),
            "lng": LNG_BASE + random.uniform(-0.005, 0.005),
            "confidence": confidence,
            "client_timestamp": datetime.datetime.now().isoformat()
        }

        # 3. Send to Backend
        try:
            requests.post(LOCAL_BACKEND_URL, json=payload)
            print(f"🚀 [AI DETECTED] {detection_type} | Confidence: {confidence} | Sent to Dashboard")
            last_sent_time = current_time 
        except Exception as e:
            print(f"⚠️ Backend Error: {e}")

    # Quit on 'Q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()