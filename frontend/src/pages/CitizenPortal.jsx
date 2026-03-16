import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE = "https://citysenseai.onrender.com";

export default function CitizenPortal() {

  // ================= STATE =================
  const [showForm, setShowForm] = useState(false);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);
  const googleMapInstance = useRef(null);
  const markersRef = useRef([]);

  // Form States
  const [formData, setFormData] = useState({ type: "Pothole", desc: "" });
  const [submitting, setSubmitting] = useState(false);

  // ================= FETCH LIVE DATA =================
  const fetchDetections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/detections`);
      const data = await res.json();
      setDetections(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchDetections();
    const interval = setInterval(fetchDetections, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= INITIALIZE MAP =================
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false
      });
    }

    // CLEAR OLD MARKERS
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // ADD NEW MARKERS
    detections.slice(0, 20).forEach(det => {
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(det.lat), lng: parseFloat(det.lng) },
        map: googleMapInstance.current,
        title: det.type,
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
      });

      markersRef.current.push(marker);
    });

  }, [detections]);

  // ================= HANDLE REPORT =================
  const handleSubmit = async () => {

    setSubmitting(true);

    const newIssue = {
      type: formData.type,
      severity: "Medium",
      lat: 19.0760 + (Math.random() * 0.02 - 0.01),
      lng: 72.8777 + (Math.random() * 0.02 - 0.01),
      client_timestamp: new Date().toISOString(),
      image_url: "https://via.placeholder.com/150"
    };

    try {

      // MAIN ROUTE
      await fetch(`${API_BASE}/api/detections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newIssue)
      });

      // OPTIONAL OLD ROUTE SUPPORT
      await fetch(`${API_BASE}/api/update-live-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newIssue)
      }).catch(() => {});

      alert("Report Submitted Successfully!");
      setShowForm(false);

      fetchDetections();

    } catch (err) {

      console.error("Submit error:", err);
      alert("Failed to submit report");

    }

    setSubmitting(false);
  };

  // ================= STATS =================
  const criticalCount = detections.filter(
    d => d.severity === "High" || d.severity === "Critical"
  ).length;

  const userReports = detections.length;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">

          <h1 className="text-xl font-bold">CitySense AI</h1>

          <nav className="flex gap-6 text-sm">
            <p className="text-blue-600 underline underline-offset-8">Dashboard</p>
            <Link to="/my-issues" className="hover:text-blue-600">
              My Issues
            </Link>
          </nav>

          <Link
            to="/"
            className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100"
          >
            Home
          </Link>

        </div>
      </header>

      {/* WELCOME BANNER */}
      <div className="max-w-7xl mx-auto mt-6 bg-blue-600 text-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold">Welcome, Citizen</h2>
        <p className="text-blue-100">
          Help us make your city safer by reporting issues you see.
        </p>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            <div className="bg-white p-4 rounded-xl border shadow">
              <p className="text-red-600 font-semibold">⚠ Critical Issues Nearby</p>
              <h1 className="text-4xl font-bold mt-2">{criticalCount}</h1>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow">
              <p className="text-blue-600 font-semibold">📍 Total Reports</p>
              <h1 className="text-4xl font-bold mt-2">{userReports}</h1>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow">
              <p className="text-purple-600 font-semibold">📝 Your Reports</p>
              <h1 className="text-4xl font-bold mt-2">3</h1>
            </div>

          </div>

          {/* MAP */}
          <div className="bg-white p-4 rounded-xl border shadow">

            <h2 className="font-bold text-lg">🗺️ City Risk Map</h2>

            <div className="h-80 bg-blue-50 rounded mt-3 relative overflow-hidden">
              <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">

          <div className="bg-white rounded-xl shadow border p-4">

            <h2 className="font-bold text-lg">📝 Report an Issue</h2>

            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              {showForm ? "Close Form" : "Submit Report"}
            </button>

            <div
              className={`mt-4 overflow-hidden transition-all duration-500 ${
                showForm ? "max-h-[500px]" : "max-h-0"
              }`}
            >

              <label className="text-sm font-semibold">Issue Type</label>

              <select
                className="w-full border rounded p-2 mt-1"
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="Pothole">Pothole</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Garbage">Garbage</option>
                <option value="Water">Water Logging</option>
              </select>

              <label className="text-sm font-semibold mt-3 block">
                Description
              </label>

              <textarea
                className="w-full border rounded p-2 mt-1"
                rows="3"
                placeholder="Describe the issue..."
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
              />

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded mt-3"
              >
                {submitting ? "Sending..." : "Submit"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
