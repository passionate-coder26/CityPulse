import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

const getSLADetails = (detection) => {
  if (detection.status === "Resolved") return { breached: false, text: "Resolved" };

  const now = new Date();
  const created = new Date(detection.timestamp);
  const diffHours = (now - created) / (1000 * 60 * 60);

  let limit = 72; // default Low
  if (detection.severity === "Critical") limit = 12;
  else if (detection.severity === "High") limit = 24;
  else if (detection.severity === "Medium") limit = 48;

  const breached = diffHours > limit;
  const remaining = Math.max(0, Math.round(limit - diffHours));

  if (breached) {
    return { breached: true, text: "SLA BREACHED", hoursOver: Math.round(diffHours - limit) };
  } else {
    return { breached: false, text: `${remaining}h left`, remaining };
  }
};

export default function AdminDashboard() {
  const [previewImage, setPreviewImage] = useState(null);
  // ================= CLOCK =================
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ================= LIVE LOGS =================
  const [logs, setLogs] = useState([
    "[System] Initializing CityPulse AI...",
    "[System] Connected to Backend API...",
  ]);
  const logRef = useRef(null);
  const lastSpokenId = useRef(null);

  // ================= REAL BACKEND DATA STATE =================
  const [detections, setDetections] = useState([]);
  const [pendingIssues, setPendingIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: FILTER STATE
  const [filter, setFilter] = useState("All"); // "All", "Critical", "Resolved"

  // ================= FEED SWITCHER STATE =================
  const isLocal = window.location.hostname === "localhost";

  const feedOptions = [
    { id: "p1", name: "Patrol Unit #21 (road_patrol)", streamSrc: "http://localhost:5001/video_feed/pothole_1", fallbackSrc: "/road_patrol.mp4" },
    { id: "p2", name: "Patrol Unit #42 (pothole_2)", streamSrc: "http://localhost:5001/video_feed/pothole_2", fallbackSrc: "/pothole_2.mp4" },
    { id: "g1", name: "Sanitation Unit #01 (garbage_1)", streamSrc: "http://localhost:5001/video_feed/garbage_1", fallbackSrc: "/garbage_1.mp4" },
    { id: "g2", name: "Sanitation Unit #07 (garbage_2)", streamSrc: "http://localhost:5001/video_feed/garbage_2", fallbackSrc: "/garbage_2.mp4" }
  ];
  const [activeFeed, setActiveFeed] = useState(feedOptions[0]);

  // MAP REFS
  const mapRef = useRef(null);
  const googleMapInstance = useRef(null);
  const markersRef = useRef([]);

  // 1. FETCH DATA FROM YOUR BACKEND
  const fetchDetections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/detections`);
      const data = await res.json();
      setDetections(data);

      if (data.length > 0) {
        const latest = data[0];
        const logMsg = `[${new Date().toLocaleTimeString()}] DETECTED: ${latest.type.toUpperCase()} (${latest.severity})`;

        setLogs(prev => {
          // Prevent Spam
          if (prev.length > 0 && prev[prev.length - 1].includes(logMsg)) {
            return prev;
          }

          // JARVIS LOGIC
          const now = Date.now();
          if (
            (latest.severity === "High" || latest.severity === "Critical") &&
            latest.status !== "Resolved" &&
            lastSpokenId.current !== latest.id // ONLY speak if it's a new issue!
          ) {
            lastSpokenId.current = latest.id; // Memorize this issue ID
            window.speechSynthesis.cancel();
            const speech = new SpeechSynthesisUtterance(
              `Alert. ${latest.severity} severity ${latest.type} detected.`
            );
            speech.rate = 1.1;
            window.speechSynthesis.speak(speech);
          }

          return [...prev.slice(-4), logMsg];
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Backend offline?", err);
    }
  };

  // Fetch pending citizen reports awaiting verification
  const fetchPendingDetections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/detections?status=Pending_Verification`);
      const data = await res.json();
      setPendingIssues(data);
    } catch (err) {
      console.error("Pending fetch error:", err);
    }
  };

  // Poll for new data every 2 seconds
  useEffect(() => {
    fetchDetections();
    fetchPendingDetections();
    const interval = setInterval(() => {
      fetchDetections();
      fetchPendingDetections();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ================= RESOLVE FUNCTION =================
  const handleResolve = async (id) => {
    try {
      // Optimistic UI Update
      setDetections(prev =>
        prev.map(d =>
          d.id === id ? { ...d, status: "Resolved", severity: "Low" } : d
        )
      );

      await fetch(`${API_BASE}/api/detections/${id}/resolve`, {
        method: "PATCH",
      });

      setLogs(prev => [...prev, `[System] Issue #${id} marked as RESOLVED.`]);
    } catch (err) {
      console.error("Error resolving issue:", err);
    }
  };

  // ================= APPROVE FUNCTION =================
  const handleApprove = async (id) => {
    try {
      // Optimistic UI Update
      const approvedIssue = pendingIssues.find(p => p.id === id);
      if (approvedIssue) {
        setPendingIssues(prev => prev.filter(p => p.id !== id));
        setDetections(prev => [
          { ...approvedIssue, status: "Open" },
          ...prev
        ]);

        setLogs(prev => [...prev, `[System] Approved citizen sighting #${id} -> status changed to OPEN.`]);
      }

      await fetch(`${API_BASE}/api/detections/${id}/approve`, {
        method: "PATCH",
      });

      fetchDetections();
      fetchPendingDetections();
    } catch (err) {
      console.error("Error approving sighting:", err);
    }
  };

  // ================= CITIZEN REPORT SIMULATION =================
  const simulateCitizenReport = async () => {
    const citizenIssue = {
      type: "Open Manhole",
      severity: "Critical",
      lat: 19.0760 + Math.random() * 0.01,
      lng: 72.8777 + Math.random() * 0.01,
      client_timestamp: new Date().toISOString(),
      source: "citizen",
    };

    await fetch(`${API_BASE}/api/detections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(citizenIssue),
    });

    fetchDetections();
    fetchPendingDetections();
    alert("📲 Citizen Report Received!");
  };

  // ================= GOOGLE MAP LOGIC =================
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    // Initialize Map Only Once
    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 19.0760, lng: 72.8777 },
        zoom: 12,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        ],
      });
    }

    // CLEAR OLD MARKERS
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // DEFINE ICONS
    const icons = {
      Critical: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      High: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
      Medium: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      Low: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      Resolved: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    };

    // FILTER LOGIC FOR MAP
    const filteredData = detections.filter(d => {
      if (filter === "All") return true;
      if (filter === "Resolved") return d.status === "Resolved";
      return d.severity === filter && d.status !== "Resolved";
    });

    // ADD NEW MARKERS
    filteredData.slice(0, 30).forEach(det => {
      const iconUrl =
        det.status === "Resolved" ? icons.Resolved : icons[det.severity] || icons.Low;

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(det.lat), lng: parseFloat(det.lng) },
        map: googleMapInstance.current,
        title: `${det.type} (${det.status})`,
        icon: iconUrl,
        animation:
          det.status !== "Resolved" && det.severity === "Critical"
            ? window.google.maps.Animation.BOUNCE
            : null,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color:black"><b>${det.type}</b><br/>Severity: ${det.severity}<br/>Status: ${det.status}</div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(googleMapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [detections, filter]);

  // ================= SCROLL LOGS =================
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const severityColor = (sev, status) => {
    if (status === "Resolved") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (sev === "Critical") return "bg-red-50 text-red-600 border-red-200";
    if (sev === "High") return "bg-orange-50 text-orange-600 border-orange-200";
    if (sev === "Medium") return "bg-amber-50 text-amber-600 border-amber-200";
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  const dotColor = (sev, status) => {
    if (status === "Resolved") return "bg-emerald-400";
    if (sev === "Critical") return "bg-red-500 animate-pulse";
    if (sev === "High") return "bg-orange-500";
    if (sev === "Medium") return "bg-amber-400";
    return "bg-blue-400";
  };

  return (
    <div className="bg-[#f0f4f8] min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ================= HEADER ================= */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-3 px-6">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                <span className="text-blue-700">City</span><span className="text-sky-500">Pulse</span> <span className="text-slate-400 font-medium text-xs">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <Link to="/admin/dashboard" className="cs-nav-active pb-3.5 -mb-3.5">
                Dashboard
              </Link>
              <Link to="/admin/reports" className="text-slate-400 hover:text-blue-600 transition-colors pb-3.5 -mb-3.5">
                AI Reports
              </Link>
              <Link to="/admin/issues" className="text-slate-400 hover:text-blue-600 transition-colors pb-3.5 -mb-3.5">
                Manage Issues
              </Link>
            </nav>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs font-semibold cs-mono bg-gradient-to-r from-blue-700 to-sky-600 text-white px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              SYSTEM ONLINE
            </span>
            <span className="text-sm font-medium text-slate-400 cs-mono">{time}</span>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Admin
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* HEADER & ACTIONS */}
        <div className="flex justify-between items-end mb-6 cs-animate-in">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              <span className="cs-gradient-text">Command Center</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Real-time urban intelligence and issue management
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={simulateCitizenReport}
              className="bg-gradient-to-r from-violet-600 to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-purple-500/20 hover:shadow-md hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
              Sim. Citizen Report
            </button>

            <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {["All", "Critical", "Resolved"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 ${filter === f
                    ? f === "Critical"
                      ? "bg-red-50 text-red-600 font-semibold"
                      : f === "Resolved"
                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                        : "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    } ${f !== "All" ? "border-l border-slate-100" : ""}`}
                >
                  {f === "Critical" ? "🔴 " : f === "Resolved" ? "✅ " : ""}{f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= LIVE PATROL MODE ================= */}
        <div className="grid grid-cols-2 gap-6 mt-4 cs-animate-in" style={{ animationDelay: '100ms' }}>
          {/* REAL AI VIDEO PANEL */}
          <div className="bg-slate-900 rounded-2xl h-[420px] relative overflow-hidden flex flex-col group border border-slate-700/50 shadow-lg cs-scanline">

            {/* OVERLAY CONTROLS (Badge & Dropdown) */}
            <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start pointer-events-none">
              <div className="text-white text-xs font-semibold bg-red-500/90 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2 shadow-lg cs-mono">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE FEED
              </div>

              {/* Feed Switcher Dropdown */}
              <select
                className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20 outline-none cursor-pointer hover:bg-white/20 transition pointer-events-auto shadow-lg cs-mono"
                value={activeFeed.id}
                onChange={(e) => {
                  const selected = feedOptions.find(f => f.id === e.target.value);
                  setActiveFeed(selected);
                }}
              >
                {feedOptions.map(feed => (
                  <option key={feed.id} value={feed.id} style={{ color: '#000' }}>
                    {feed.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DYNAMIC MEDIA PLAYER */}
            <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
              {isLocal ? (
                <>
                  <img
                    src={activeFeed.streamSrc}
                    alt={activeFeed.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex-col items-center justify-center text-slate-500">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-blue-500/50"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <p className="cs-mono text-sm">Awaiting {activeFeed.name}...</p>
                    <p className="cs-mono text-xs text-slate-600 mt-1">Signal Reconnecting...</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 w-full h-full">
                  <video
                    src={activeFeed.fallbackSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-14 left-3 bg-emerald-600/90 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold animate-pulse z-30 shadow-md">
                    ● AI Edge Node Processing
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MAP PANEL */}
          <div className="cs-card p-4 relative">
            <h3 className="font-semibold text-sm mb-2 text-slate-700 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
              Live Incident Map
            </h3>
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl h-[370px] relative overflow-hidden">
              <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>

        {/* ================= LIVE LOG TERMINAL ================= */}
        <div
          className="cs-terminal p-4 h-40 mt-6 overflow-y-auto text-sm shadow-lg cs-animate-in"
          ref={logRef}
          style={{ animationDelay: '200ms' }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs text-slate-500 ml-2 cs-mono">system_log — CityPulse AI v2.0</span>
          </div>
          {logs.map((l, i) => (
            <p key={i} className="cs-mono text-xs leading-6">
              <span className="text-slate-500">$</span> {l}
            </p>
          ))}
        </div>

        {/* ================= PENDING CITIZEN VERIFICATIONS ================= */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm mt-6 cs-animate-in" style={{ animationDelay: '250ms' }}>
          <h3 className="font-extrabold text-slate-800 text-lg mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            Pending Citizen Verifications
          </h3>
          <p className="text-slate-400 text-xs mb-4">
            Incoming citizen reports waiting for administrator review and publication to the live sector grid
          </p>

          {pendingIssues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIssues.map(issue => (
                <div key={issue.id} className="border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    {issue.image_url ? (
                      <div className="relative h-32 overflow-hidden border-b border-slate-200">
                        <img
                          src={issue.image_url}
                          alt={issue.type}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-300"
                          onClick={() => setPreviewImage(issue)}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=No+Img"; }}
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-500 text-white shadow-sm flex items-center gap-1 leading-none">
                          🕒 PENDING
                        </span>
                      </div>
                    ) : (
                      <div className="h-32 bg-slate-100 flex items-center justify-center border-b border-slate-200 text-xs text-slate-400 italic">
                        No image evidence
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm capitalize">{issue.type}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${severityColor(issue.severity, 'Pending')}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1"><span className="text-blue-500">📍</span> <span className="font-mono text-[10px]">{parseFloat(issue.lat).toFixed(5)}, {parseFloat(issue.lng).toFixed(5)}</span></p>
                        <p className="flex items-center gap-1"><span className="text-blue-500">⏰</span> <span>{new Date(issue.timestamp).toLocaleString()}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleApprove(issue.id)}
                      className="w-full bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Approve & Publish to Grid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/20">
              <p className="text-slate-400 text-sm font-semibold flex items-center justify-center gap-2">
                <span className="text-emerald-500">🎉</span> Zero pending verifications: Grid fully verified
              </p>
            </div>
          )}
        </div>

        {/* ================= STATS & LIST ================= */}
        <div className="grid md:grid-cols-3 gap-6 mt-6 pb-10 cs-animate-in" style={{ animationDelay: '300ms' }}>
          {/* STATS CARD */}
          <div className="cs-card p-6 cs-accent-top">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <p className="font-semibold text-sm text-slate-600">Critical Issues</p>
            </div>
            <h2 className="text-5xl font-extrabold mt-2 text-red-500">
              {
                detections.filter(
                  d => d.severity === "Critical" && d.status !== "Resolved"
                ).length
              }
            </h2>
            <p className="text-slate-400 text-xs mt-2">
              Requiring immediate attention
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <p className="font-semibold text-sm text-slate-600">Total Resolved</p>
              </div>
              <h2 className="text-3xl font-extrabold mt-1 text-emerald-500">
                {detections.filter(d => d.status === "Resolved").length}
              </h2>
            </div>
          </div>

          {/* LIST OF ISSUES */}
          <div className="md:col-span-2 cs-card p-6">
            <h3 className="font-bold mb-4 text-slate-700 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              Recent Detections
            </h3>
            <div className="overflow-y-auto h-64 pr-2">
              <ul className="space-y-1">
                {detections
                  .filter(d => {
                    if (filter === "All") return true;
                    if (filter === "Resolved") return d.status === "Resolved";
                    return d.severity === filter && d.status !== "Resolved";
                  })
                  .map(d => (
                    <li
                      key={d.id}
                      className={`rounded-xl py-3 px-4 flex justify-between items-center transition-all duration-200 hover:bg-slate-50 ${d.status === "Resolved" ? "opacity-50" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {d.image_url && (
                          <img
                            src={d.image_url}
                            alt={d.type}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm hover:scale-105 cursor-pointer transition duration-200"
                            onClick={() => setPreviewImage(d)}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=No+Img"; }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${dotColor(d.severity, d.status)}`}></span>
                            <span className="font-semibold capitalize text-sm text-slate-700">{d.type}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${severityColor(d.severity, d.status)}`}>
                              {d.severity}
                            </span>

                            {/* SLA Alert Badge */}
                            {(() => {
                              const sla = getSLADetails(d);
                              if (d.status !== "Resolved") {
                                return sla.breached ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 animate-pulse flex items-center gap-1">
                                    🚨 SLA BREACHED (+{sla.hoursOver}h)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1 cs-mono">
                                    ⏳ {sla.text}
                                  </span>
                                );
                              }
                              return null;
                            })()}

                            {/* Sightings Badge */}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1">
                              👁️ {d.detection_count || 1}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-1 cs-mono">
                            {new Date(d.timestamp).toLocaleTimeString()} • {parseFloat(d.lat).toFixed(4)}, {parseFloat(d.lng).toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {d.status !== "Resolved" ? (
                        <button
                          onClick={() => handleResolve(d.id)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Resolve
                        </button>
                      ) : (
                        <span className="text-emerald-500 text-xs font-bold border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Done
                        </span>
                      )}
                    </li>
                  ))}
                {detections.length === 0 && (
                  <p className="text-slate-400 text-center py-8 text-sm">
                    {loading ? "System Initializing..." : "No detections found."}
                  </p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* ================= PREVIEW IMAGE MODAL ================= */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="cs-glass border border-white/40 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative cs-animate-in" onClick={e => e.stopPropagation()}>
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600"></div>

            <div className="p-4 border-b border-slate-200/50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 capitalize flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {previewImage.type} Sighting
              </h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <img
                src={previewImage.image_url}
                alt={previewImage.type}
                className="w-full h-64 object-cover rounded-xl shadow-md border border-slate-200"
                onError={(e) => { e.target.src = "https://via.placeholder.com/400x250?text=No+Image+Evidence"; }}
              />
              <div className="mt-4 w-full text-left space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2"><span className="text-blue-500">📍</span> <b className="text-slate-700">Coordinates:</b> <span className="cs-mono text-xs">{previewImage.lat}, {previewImage.lng}</span></p>
                <p className="flex items-center gap-2"><span className="text-blue-500">⏰</span> <b className="text-slate-700">Reported:</b> {new Date(previewImage.timestamp).toLocaleString()}</p>
                <p className="flex items-center gap-2"><span className="text-blue-500">👁️</span> <b className="text-slate-700">Sightings:</b> {previewImage.detection_count || 1}</p>
                <p className="flex items-center gap-2"><span className="text-blue-500">⚠️</span> <b className="text-slate-700">Severity:</b>
                  <span className={`px-2 py-0.5 rounded-md font-semibold text-xs border ${severityColor(previewImage.severity, previewImage.status)}`}>{previewImage.severity}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
