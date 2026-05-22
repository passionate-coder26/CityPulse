import requests
import time
import random
import datetime
import sys

# Ensure UTF-8 output encoding for emojis in Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# The Backend URL
url = "http://localhost:5000/api/detections"

# Mock coordinates around Mumbai (fixed spots to trigger clustering naturally)
spots = [
    {"lat": 19.1136, "lng": 72.8697, "name": "Andheri East"},
    {"lat": 19.1205, "lng": 72.8624, "name": "JVLR Highway"},
    {"lat": 19.1054, "lng": 72.8752, "name": "Sakinaka Crossing"}
]

# Premium Unsplash image evidence matching incident types
images = {
    "pothole": [
        "https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1599740831140-523176d63a8a?w=600&auto=format&fit=crop&q=80"
    ],
    "garbage": [
        "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80"
    ],
    "water_logging": [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80"
    ]
}

offline_queue = []

print("🚗 Starting CitySense Telemetry Simulation... (Press Ctrl+C to stop)")
print(f"📡 Targets node backend: {url}\n")

while True:
    # 1. Create a live sighting details
    incident_type = random.choice(["pothole", "garbage", "water_logging"])
    confidence = round(random.uniform(0.5, 1.0), 2)
    
    # Apply Multi-Frame Verification Filter: Only send when confidence > 0.8
    if confidence <= 0.8:
        print(f"🔍 [Filtered] Sighting confidence too low ({confidence}) for raw {incident_type}. Skipping detection.")
        time.sleep(3)
        continue

    # Pick a spot and add micro GPS jitter (~2-3 meters) to test 10m clustering
    spot = random.choice(spots)
    lat = spot["lat"] + random.uniform(-0.00004, 0.00004)
    lng = spot["lng"] + random.uniform(-0.00004, 0.00004)
    
    severity = random.choice(["Low", "Medium", "High", "Critical"])
    img_list = images.get(incident_type, ["https://via.placeholder.com/150?text=Live+Detection"])
    image_url = random.choice(img_list)

    detection = {
        "id": str(int(time.time())),
        "type": incident_type,
        "severity": severity,
        "lat": lat,
        "lng": lng,
        "confidence": confidence,
        "client_timestamp": datetime.datetime.now().isoformat(),
        "image_url": image_url
    }

    # 2. Try sending the live detection
    try:
        response = requests.post(url, json=detection, timeout=4)
        if response.status_code == 200:
            res_data = response.json()
            is_clustered = res_data.get("clustered", False)
            status_text = "♻️ Clustered into existing issue" if is_clustered else "🆕 Logged as new issue"
            print(f"✅ Sent: {detection['type']} ({detection['severity']}) - {status_text} (confidence: {confidence}) at {spot['name']}")
            
            # Flush queue if we are reconnected
            if offline_queue:
                print(f"🔄 Reconnected! Flushing {len(offline_queue)} queued detections...")
                while offline_queue:
                    queued_item = offline_queue[0]
                    try:
                        q_resp = requests.post(url, json=queued_item, timeout=4)
                        if q_resp.status_code == 200:
                            q_data = q_resp.json()
                            q_clustered = q_data.get("clustered", False)
                            q_status = "♻️ Clustered" if q_clustered else "🆕 Logged"
                            print(f"  📤 Flushed queued: {queued_item['type']} ({queued_item['severity']}) - {q_status}")
                            offline_queue.pop(0)
                        else:
                            print(f"  ❌ Failed to flush queued item (Status {q_resp.status_code}). Stopping flush.")
                            break
                    except Exception as q_err:
                        print(f"  ⚠️ Reconnection lost during flush: {q_err}. Keeping rest in queue.")
                        break
        else:
            print(f"❌ Error: Server returned {response.status_code}. Saving payload to queue.")
            offline_queue.append(detection)
    except Exception as e:
        offline_queue.append(detection)
        print(f"⚠️ Server offline. Saved detection to queue. (Queue size: {len(offline_queue)})")

    # Wait 5 seconds before next detection
    time.sleep(5)