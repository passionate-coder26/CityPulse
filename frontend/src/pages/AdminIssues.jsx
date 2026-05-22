import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000" : "https://citysenseai.onrender.com";

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
    return { breached: false, text: `⏳ ${remaining}h left`, remaining };
  }
};

export default function AdminIssues() {
  const [detections, setDetections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA
  useEffect(() => {
    fetch(`${API_BASE}/api/detections`)
      .then((res) => res.json())
      .then((data) => {
        setDetections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 2. CALCULATE LIVE STATS
  const totalDetected = detections.length;
  const criticalCount = detections.filter(
    (d) => d.severity === "High" || d.severity === "Critical"
  ).length;
  const inProgressCount = detections.filter(
    (d) => d.severity === "Medium"
  ).length;

  // 3. FILTER LOGIC
  const filteredIssues = detections.filter(
    (d) =>
      d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.severity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. RESOLVE ISSUE
  const handleResolve = async (id) => {
    try {
      // Optimistic UI Update
      setDetections((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: "Resolved", severity: "Low" } : d
        )
      );

      // Call Backend
      await fetch(`${API_BASE}/api/detections/${id}/resolve`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Error resolving issue:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="w-full border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="text-black text-xl font-bold">
            CitySense AI
          </Link>

          <nav className="flex-1 flex justify-center">
            <ul className="flex items-center gap-10 text-gray-700 font-medium">
              <li>
                <Link to="/admin/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/issues"
                  className="text-blue-600 font-semibold"
                >
                  Issues
                </Link>
              </li>
              <li>
                <Link to="/admin/reports" className="hover:text-blue-600">
                  Reports
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-sm text-red-500">Logout</button>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* TITLE & EXPORT */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Issue Management</h2>
            <p className="text-gray-600 text-sm">
              Review, approve, and resolve detected civic issues
            </p>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
            Export Data
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-3 gap-5 mt-6">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-sm">Total Detected</p>
            <p className="text-3xl font-bold mt-1">{totalDetected}</p>
            <p className="text-xs text-gray-500 mt-1">Live from sensors</p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-sm">Critical / High</p>
            <p className="text-3xl font-bold mt-1 text-red-500">
              {criticalCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-sm">Medium Risk</p>
            <p className="text-3xl font-bold mt-1 text-orange-500">
              {inProgressCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Being monitored</p>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="grid grid-cols-3 gap-5 mt-6">
          <div className="col-span-2 bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Filters & Search</h3>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-blue-500"
              placeholder="Search by issue type (e.g. 'Pothole') or severity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-4 mt-4">
              <span className="text-xs text-gray-400">
                Showing {filteredIssues.length} issues
              </span>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <h3 className="font-semibold text-sm mb-2">Issue Details</h3>
            <p className="text-gray-500 text-sm">
              Select an item below to view full logs.
            </p>
          </div>
        </div>

        {/* LIST OF ISSUES */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500">Loading issues...</p>
          ) : filteredIssues.length === 0 ? (
            <p className="text-center text-gray-500">
              No issues found matching your search.
            </p>
          ) : (
            filteredIssues.map((d, index) => (
              <div
                key={d.id || index}
                className="bg-white border rounded-xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition"
              >
                <div className="flex gap-4 items-start">
                  {d.image_url && (
                    <img
                      src={d.image_url}
                      alt={d.type}
                      className="w-20 h-20 object-cover rounded-lg border shadow-sm hover:scale-105 transition duration-200"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=No+Img"; }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm capitalize">{d.type}</p>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded border text-gray-500 font-mono">
                        ID: {d.id ? String(d.id).substring(0, 8) : index}
                      </span>
                      
                      {/* SLA Countdown / Breach Badge */}
                      {(() => {
                        const sla = getSLADetails(d);
                        if (d.status !== "Resolved") {
                          return sla.breached ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 border border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse flex items-center gap-1">
                              🚨 SLA BREACHED (+{sla.hoursOver}h)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                              {sla.text}
                            </span>
                          );
                        }
                        return null;
                      })()}

                      {/* Sightings Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 flex items-center gap-1">
                        👁️ {d.detection_count || 1} sightings
                      </span>
                    </div>

                    <p className="text-gray-600 text-xs mt-1">
                      Detected at {new Date(d.timestamp).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Lat: {d.lat}, Lng: {d.lng}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <span className="text-xs border rounded px-2 py-0.5 bg-blue-50 text-blue-600 font-medium">
                        AI Verified
                      </span>
                      {d.status === "Resolved" && (
                        <span className="text-xs border rounded px-2 py-0.5 bg-green-50 text-green-600 font-medium">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-4 py-2 rounded-full border font-semibold ${
                      d.status === "Resolved"
                        ? "border-green-400 text-green-600 bg-green-50"
                        : d.severity === "High" || d.severity === "Critical"
                        ? "border-red-400 text-red-600 bg-red-50"
                        : d.severity === "Medium"
                        ? "border-orange-400 text-orange-600 bg-orange-50"
                        : "border-green-400 text-green-600 bg-green-50"
                    }`}
                  >
                    {d.status === "Resolved" ? "Resolved" : `${d.severity} Risk`}
                  </span>

                  {d.status !== "Resolved" && (
                    <button
                      onClick={() => handleResolve(d.id)}
                      className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-medium transition"
                    >
                      ✅ Mark Fixed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
