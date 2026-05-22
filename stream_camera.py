from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import requests
import time
import datetime

# ================= 1. CONFIGURATION =================
BACKEND_URL = "http://localhost:5000/api/detections"
CONFIDENCE_THRESHOLD = 0.65

# Your exact 4 camera streams
STREAMS = {
    "pothole_1": {"video_path": "frontend/public/road_patrol.mp4", "model": "pothole", "type": "Pothole", "lat": 19.1136, "lng": 72.8697},
    "pothole_2": {"video_path": "frontend/public/pothole_2.mp4", "model": "pothole", "type": "Pothole", "lat": 19.1180, "lng": 72.8750},
    "garbage_1": {"video_path": "frontend/public/garbage_1.mp4", "model": "garbage", "type": "Garbage", "lat": 19.0760, "lng": 72.8777},
    "garbage_2": {"video_path": "frontend/public/garbage_2.mp4", "model": "garbage", "type": "Garbage", "lat": 19.0800, "lng": 72.8800}
}

app = Flask(__name__)
CORS(app)

print("🧠 Loading AI Models into memory... This might take a second.")
models = {
    "pothole": YOLO("pothole_best.pt"),
    "garbage": YOLO("garbage_best.pt")
}
print("✅ Models Loaded! System Ready.")

last_sent_times = {stream_id: 0 for stream_id in STREAMS.keys()}

# ================= 2. GENERATOR FUNCTION =================
def generate_frames(stream_id):
    config = STREAMS[stream_id]
    model = models[config["model"]]
    cap = cv2.VideoCapture(config["video_path"])
    
    if not cap.isOpened():
        print(f"❌ ERROR: Could not open {config['video_path']}")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        results = model(frame, verbose=False)
        detected = False
        highest_conf = 0.0

        for r in results:
            for box in r.boxes:
                confidence = float(box.conf[0])
                if confidence > CONFIDENCE_THRESHOLD:
                    detected = True
                    highest_conf = max(highest_conf, confidence)
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    color = (0, 0, 255) if config["type"] == "Pothole" else (0, 165, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    cv2.putText(frame, f"{config['type']} {confidence:.2f}", (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        current_time = time.time()
        if detected and (current_time - last_sent_times[stream_id] > 5):
            payload = {
                "type": config["type"],
                "severity": "High" if highest_conf > 0.85 else "Medium",
                "lat": config["lat"], "lng": config["lng"],
                "confidence": round(highest_conf, 2),
                "client_timestamp": datetime.datetime.now().isoformat(),
                "image_url": f"https://via.placeholder.com/150?text={config['type']}+Cam"
            }
            try:
                requests.post(BACKEND_URL, json=payload, timeout=2)
                last_sent_times[stream_id] = current_time
            except:
                pass

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

# ================= 3. DYNAMIC ROUTES =================
@app.route('/video_feed/<stream_id>')
def video_feed(stream_id):
    if stream_id not in STREAMS:
        return "Camera not found", 404
    return Response(generate_frames(stream_id), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("📡 Starting Multi-Cam AI Server on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, threaded=True)