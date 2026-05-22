from ultralytics import YOLO
import cv2
import requests
import time
import datetime

# ================= CONFIGURATION =================
MODEL_PATH = "pothole_best.pt"
VIDEO_PATH = "frontend/public/road_patrol.mp4" 
BACKEND_URL = "http://localhost:5000/api/detections"
CONFIDENCE_THRESHOLD = 0.70  # Model must be 70% sure to trigger an alert

# ================= INITIALIZATION =================
print(f"🧠 Loading AI Model from {MODEL_PATH}...")
model = YOLO(MODEL_PATH)
print(f"✅ Model Loaded! Starting video playback for {VIDEO_PATH}...")

cap = cv2.VideoCapture(VIDEO_PATH)
last_sent_time = 0 

# ================= MAIN VISION LOOP =================
while cap.isOpened():
    success, frame = cap.read()
    
    if not success:
        print("🎬 Video playback finished!")
        break

    # 1. Run YOLO inference on the current video frame
    results = model(frame, verbose=False)
    
    pothole_detected = False
    highest_conf = 0.0

    # 2. Parse the bounding boxes
    for r in results:
        boxes = r.boxes
        for box in boxes:
            confidence = float(box.conf[0])
            
            if confidence > CONFIDENCE_THRESHOLD:
                pothole_detected = True
                highest_conf = max(highest_conf, confidence)
                
                # Draw a red box around the pothole on the video
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"Pothole {confidence:.2f}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # 3. Send alert to the Node.js Backend (max 1 alert every 5 seconds)
    current_time = time.time()
    if pothole_detected and (current_time - last_sent_time > 5):
        payload = {
            "type": "pothole",
            "severity": "High" if highest_conf > 0.85 else "Medium",
            "lat": 19.1136, 
            "lng": 72.8697,
            "confidence": round(highest_conf, 2),
            "client_timestamp": datetime.datetime.now().isoformat(),
            "image_url": "https://via.placeholder.com/150?text=Live+AI+Capture"
        }
        
        try:
            requests.post(BACKEND_URL, json=payload, timeout=2)
            print(f"🚨 SENT TO BACKEND: Pothole detected with {highest_conf*100:.1f}% confidence!")
            last_sent_time = current_time
        except Exception as e:
            print("⚠️ Backend offline, couldn't send data.")

    # 4. Display the video feed
    cv2.imshow("CitySense AI - Live Inference", frame)

    # Press 'q' to quit. waitKey(30) paces the video at ~30 FPS.
    if cv2.waitKey(30) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()