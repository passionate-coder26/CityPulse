import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

  const severityColor = (sev, status) => {
    if (status === "Resolved") return "border-emerald-300 text-emerald-600 bg-emerald-50";
    if (sev === "High" || sev === "Critical") return "border-red-300 text-red-600 bg-red-50";
    if (sev === "Medium") return "border-amber-300 text-amber-600 bg-amber-50";
    return "border-blue-300 text-blue-600 bg-blue-50";
  };

  return (
    <div className="bg-[#f0f4f8] min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              <span className="text-blue-700">City</span><span className="text-sky-500">Pulse</span> <span className="text-slate-400 font-medium text-xs">AI</span>
            </span>
          </Link>

          <nav className="flex-1 flex justify-center">
            <ul className="flex items-center gap-8 text-sm font-medium">
              <li>
                <Link to="/admin/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/issues" className="cs-nav-active pb-3.5 -mb-3.5">
                  Issues
                </Link>
              </li>
              <li>
                <Link to="/admin/reports" className="text-slate-400 hover:text-blue-600 transition-colors">
                  Reports
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors">Logout</Link>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* TITLE & EXPORT */}
        <div className="flex justify-between items-center cs-animate-in">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
              <span className="cs-gradient-text">Issue Management</span>
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Review, approve, and resolve detected civic issues
            </p>
          </div>

          <button className="cs-btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Data
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-3 gap-5 mt-6 cs-stagger">
          <div className="cs-card p-5 cs-accent-top cs-animate-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <p className="font-semibold text-sm text-slate-600">Total Detected</p>
            </div>
            <p className="text-4xl font-extrabold mt-2 cs-gradient-text">{totalDetected}</p>
            <p className="text-xs text-slate-400 mt-1 cs-mono">Live from sensors</p>
          </div>

          <div className="cs-card p-5 cs-animate-in" style={{ borderTop: '3px solid #ef4444' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <p className="font-semibold text-sm text-slate-600">Critical / High</p>
            </div>
            <p className="text-4xl font-extrabold mt-2 text-red-500">{criticalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Needs attention</p>
          </div>

          <div className="cs-card p-5 cs-animate-in" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="font-semibold text-sm text-slate-600">Medium Risk</p>
            </div>
            <p className="text-4xl font-extrabold mt-2 text-amber-500">{inProgressCount}</p>
            <p className="text-xs text-slate-400 mt-1">Being monitored</p>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="grid grid-cols-3 gap-5 mt-6 cs-animate-in" style={{ animationDelay: '150ms' }}>
          <div className="col-span-2 cs-card p-5">
            <h3 className="font-semibold text-sm mb-3 text-slate-700 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search Issues
            </h3>
            <input
              className="cs-input w-full px-4 py-3 text-sm"
              placeholder="Search by issue type (e.g. 'Pothole') or severity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-slate-400 cs-mono">
                Showing {filteredIssues.length} issues
              </span>
            </div>
          </div>

          <div className="cs-card p-5 flex flex-col justify-center">
            <h3 className="font-semibold text-sm mb-2 text-slate-700 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Issue Details
            </h3>
            <p className="text-slate-400 text-sm">
              Select an item below to view full logs.
            </p>
          </div>
        </div>

        {/* LIST OF ISSUES */}
        <div className="mt-6 space-y-3 cs-animate-in" style={{ animationDelay: '250ms' }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400 text-sm">Loading issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <p className="text-center text-slate-400 py-12">
              No issues found matching your search.
            </p>
          ) : (
            filteredIssues.map((d, index) => (
              <div
                key={d.id || index}
                className="cs-card p-5 flex justify-between items-center"
              >
                <div className="flex gap-4 items-start">
                  {d.image_url && (
                    <img
                      src={d.image_url}
                      alt={d.type}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm hover:scale-105 transition duration-200 cursor-pointer"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=No+Img"; }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm capitalize text-slate-700">{d.type}</p>
                      <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-400 cs-mono">
                        ID: {d.id ? String(d.id).substring(0, 8) : index}
                      </span>
                      
                      {/* SLA Countdown / Breach Badge */}
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
                        👁️ {d.detection_count || 1} sightings
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs mt-1.5 cs-mono">
                      Detected at {new Date(d.timestamp).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-xs cs-mono">
                      {parseFloat(d.lat).toFixed(4)}, {parseFloat(d.lng).toFixed(4)}
                    </p>

                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] border rounded-md px-2 py-0.5 bg-blue-50 text-blue-600 border-blue-100 font-semibold flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        AI Verified
                      </span>
                      {d.status === "Resolved" && (
                        <span className="text-[10px] border rounded-md px-2 py-0.5 bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-4 py-2 rounded-full border font-semibold ${severityColor(d.severity, d.status)}`}
                  >
                    {d.status === "Resolved" ? "Resolved" : `${d.severity} Risk`}
                  </span>

                  {d.status !== "Resolved" && (
                    <button
                      onClick={() => handleResolve(d.id)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:shadow-sm flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Resolve
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
