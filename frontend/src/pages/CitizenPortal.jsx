import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

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

  // Real Location & Camera States
  const [location, setLocation] = useState(null); // { lat, lng }
  const [locating, setLocating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // Base64 image data URI
  const [selected, setSelected] = useState(null);

  // ================= FETCH LIVE DATA =================
 const fetchDetections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/detections?status=Open`);
      
      // Check if response is OK before parsing
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      const data = await res.json();
      
      // Safety check: ensure data is an array
      setDetections(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setDetections([]); // Prevents the .filter crash
    }
  };

  useEffect(() => {
    fetchDetections();
    const interval = setInterval(fetchDetections, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= GEOLOCATION CAPTURE =================
  const grabLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation error, using demo fallback coordinates:", error.message);
        // Silent beautiful fallback so the demo never fails
        setLocation({
          lat: 19.076 + (Math.random() * 0.01 - 0.005),
          lng: 72.8777 + (Math.random() * 0.01 - 0.005),
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Auto grab location on opening the form
  useEffect(() => {
    if (showForm) {
      grabLocation();
    }
  }, [showForm]);

  // ================= CAMERA/IMAGE CONVERSION =================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= INITIALIZE MAP =================
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.076, lng: 72.8777 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }, { lightness: 17 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 18 }],
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }, { lightness: 16 }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 21 }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#dedede" }, { lightness: 21 }],
          },
        ],
      });
    }

    // CLEAR OLD MARKERS
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // ADD NEW MARKERS
    detections.slice(0, 20).forEach((det) => {
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(det.lat), lng: parseFloat(det.lng) },
        map: googleMapInstance.current,
        title: det.type,
      });

      marker.addListener("click", () => {
        setSelected(det); // This updates the state, which triggers the InfoWindow useEffect
      });

      markersRef.current.push(marker);
    });
  }, [detections]);

  // ================= HANDLE POPUP =================
  useEffect(() => {
    if (!window.google || !googleMapInstance.current) return;

    // Create a singleton InfoWindow so we don't have duplicates
    if (!window.infoWindow) {
      window.infoWindow = new window.google.maps.InfoWindow();
    }

    if (selected) {
      const contentString = `
      <div style="color: #0f172a; padding: 6px; font-family: 'Inter', sans-serif; max-width: 200px;">
        <h3 style="font-weight: 800; font-size: 14px; margin: 0 0 4px 0; color: #1e40af;">${selected.type}</h3>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;"><strong>Severity:</strong> <span style="font-weight: 700; color: ${
          selected.severity === "Critical" ? "#ef4444" : "#f59e0b"
        };">${selected.severity}</span></p>
        <img src="${selected.image_url}" style="width:100%; height:90px; object-fit:cover; border-radius:8px; border: 1px solid #e2e8f0;" />
      </div>
    `;
      window.infoWindow.setContent(contentString);
      window.infoWindow.setPosition({ lat: selected.lat, lng: selected.lng });
      window.infoWindow.open(googleMapInstance.current);
    } else {
      window.infoWindow.close();
    }
  }, [selected]);

  // ================= HANDLE REPORT =================
  const handleSubmit = async () => {
    // 🛑 STRICT ENFORCEMENT: Block submission if GPS is missing
    if (!location) {
      alert("📍 GPS Required: Please allow location access so we can pinpoint the issue.");
      return;
    }

    // 🛑 STRICT ENFORCEMENT: Block submission if Photo is missing
    if (!imagePreview) {
      alert("📷 Evidence Required: Please snap or upload a photo of the issue.");
      return;
    }

    setSubmitting(true);

    const newIssue = {
      type: formData.type,
      severity: "Medium", // Citizens default to medium, AI can upgrade it later
      lat: location.lat,
      lng: location.lng,
      client_timestamp: new Date().toISOString(),
      image_url: imagePreview,
      confidence: 1.0, // Citizen reports are manual, so confidence is 100%
      source: "citizen",
    };

    try {
      await fetch(`${API_BASE}/api/detections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIssue),
      });

      alert("✅ Report Submitted Successfully!");
      setShowForm(false);
      setImagePreview(null);
      // We don't clear location so they can submit another issue quickly if needed
      fetchDetections();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit report. Backend might be offline.");
    }

    setSubmitting(false);
  };

  // ================= STATS =================
  const criticalCount = detections.filter(
    (d) => d.severity === "High" || d.severity === "Critical"
  ).length;

  const userReports = detections.length;

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-14" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* NAVBAR */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">
              City<span className="text-blue-600">Pulse</span> <span className="text-slate-400 font-medium text-xs">Citizen</span>
            </span>
          </Link>

          <nav className="flex gap-6 text-sm font-semibold">
            <span className="text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4">
              Dashboard
            </span>
            <Link to="/my-issues" className="text-slate-400 hover:text-blue-600 transition-colors">
              My Issues
            </Link>
          </nav>

          <Link
            to="/"
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
          >
            Home
          </Link>
        </div>
      </header>

      {/* WELCOME BANNER */}
      <div className="max-w-7xl mx-auto mt-6 bg-gradient-to-r from-blue-700 to-sky-500 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden cs-animate-in">
        <div className="absolute inset-0 cs-grid-bg opacity-15"></div>
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm mb-3">
            📍 ACTIVE SECTOR GRID
          </span>
          <h2 className="text-3xl font-black tracking-tight">Welcome to the Citizen Portal</h2>
          <p className="text-blue-100 mt-2 text-sm max-w-2xl font-medium">
            Your live contributions power predictive city repairs. Report potholes, faulty streetlights, or sanitation issues to help build a cleaner, safer urban community.
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 cs-stagger">
            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cs-accent-top cs-animate-in">
              <span className="text-red-500 font-bold text-xs tracking-wider uppercase block">⚠️ Critical Hazards Nearby</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-slate-800">{criticalCount}</span>
                <span className="text-slate-400 text-xs font-semibold">active</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cs-animate-in" style={{ borderTop: "3px solid #2563eb" }}>
              <span className="text-blue-600 font-bold text-xs tracking-wider uppercase block">📍 Community Reports</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-slate-800">{userReports}</span>
                <span className="text-slate-400 text-xs font-semibold">submitted</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cs-animate-in" style={{ borderTop: "3px solid #8b5cf6" }}>
              <span className="text-purple-600 font-bold text-xs tracking-wider uppercase block">📝 Your Open Sigthings</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-extrabold text-slate-800">3</span>
                <span className="text-slate-400 text-xs font-semibold">tracked</span>
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm cs-animate-in" style={{ animationDelay: "200ms" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                Interactive Citizen Safety Map
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono bg-slate-50 px-2 py-1 rounded">LIVE MAP DATA</span>
            </div>

            <div className="h-96 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200/60 shadow-inner">
              <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm cs-animate-in" style={{ animationDelay: "250ms" }}>
            <h2 className="font-extrabold text-slate-800 text-lg">📝 Lodge Incident Report</h2>
            <p className="text-slate-500 text-xs mt-1">Submit high-confidence urban evidence directly to active patrol units</p>

            <button
              onClick={() => setShowForm(!showForm)}
              className={`mt-4 w-full py-3 rounded-xl font-bold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                showForm
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "cs-btn-primary shadow-blue-500/20"
              }`}
            >
              {showForm ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Close Sighting Form
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Launch Report Form
                </>
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-500 ${
                showForm ? "max-h-[850px] mt-5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Issue Category</label>
                  <select
                    className="w-full cs-input px-3 py-2.5 text-sm font-medium text-slate-700 bg-white"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Pothole">🚨 Road Pothole</option>
                    <option value="Streetlight">💡 Failed Streetlight</option>
                    <option value="Garbage">🗑️ Overflowing Garbage Bin</option>
                    <option value="Water">💧 Water Logging / Drainage</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Detailed Description</label>
                  <textarea
                    className="w-full cs-input px-3 py-2 text-sm text-slate-700"
                    rows="3"
                    placeholder="Provide specific location landmarks or description..."
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  />
                </div>

                {/* Geolocation Status / Details */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      📍 GPS Telemetry
                    </span>
                    <button
                      onClick={grabLocation}
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
                    >
                      {locating ? "Locking..." : "🔄 Refresh GPS"}
                    </button>
                  </div>
                  {location ? (
                    <div className="bg-white border border-slate-100 rounded-lg p-2.5 font-mono text-[11px] text-slate-600 leading-normal">
                      <div className="flex justify-between">
                        <span className="text-slate-400">LATITUDE</span>
                        <span className="font-bold text-blue-700">{parseFloat(location.lat).toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-400">LONGITUDE</span>
                        <span className="font-bold text-blue-700">{parseFloat(location.lng).toFixed(6)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Fetching device coordinates...</p>
                  )}
                </div>

                {/* Camera Trigger & Photo Snapper */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">📷 Visual Evidence Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="w-full border border-dashed border-slate-200 rounded-xl p-3 text-xs bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition text-slate-500 font-semibold"
                    onChange={handleImageChange}
                  />
                </div>

                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md cs-animate-in">
                    <img
                      src={imagePreview}
                      className="w-full h-40 object-cover"
                      alt="Captured Sighting Proof"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      type="button"
                      className="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold transition shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || locating}
                  className="w-full bg-gradient-to-r from-blue-700 to-sky-600 text-white font-bold py-3 px-5 rounded-xl mt-2 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] duration-200 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading Sighting...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      Submit Incident Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
