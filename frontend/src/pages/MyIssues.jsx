import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

export default function MyIssues() {
  const [issuesData, setIssuesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);

  // ================= FETCH REAL BACKEND DATA =================
  useEffect(() => {
    fetch(`${API_BASE}/api/detections?include_pending=true`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((d) => {
          // STATUS NORMALIZATION
          let status = "Pending";
          if (d.status === "Resolved") status = "Resolved";
          else if (d.status === "Open" || d.status === "Pending_Verification") status = "Pending";
          else if (d.status === "In progress") status = "In progress";

          // SEVERITY → RISK + COLOR
          let risk = "Moderate";
          let color = "bg-blue-50 text-blue-600 border-blue-100";

          if (d.severity === "Critical") {
            risk = "Critical";
            color = "bg-red-50 text-red-600 border-red-100";
          } else if (d.severity === "High") {
            risk = "High";
            color = "bg-orange-50 text-orange-600 border-orange-100";
          } else if (d.severity === "Medium") {
            risk = "Moderate";
            color = "bg-amber-50 text-amber-600 border-amber-100";
          }

          // CONFIRMATION LEVEL MAPPING
          let confirmation = "Possible";
          let confColor = "bg-amber-50 text-amber-700 border-amber-200";
          const count = d.detection_count || 1;
          if (count >= 5) {
            confirmation = "Verified / Action Taken";
            confColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
          } else if (count >= 2) {
            confirmation = "Confirmed";
            confColor = "bg-blue-50 text-blue-700 border-blue-200";
          }

          return {
            id: d.id,
            title: d.type || "Reported Issue",
            desc: `Detected at Lat: ${parseFloat(d.lat).toFixed(4)}, Lng: ${parseFloat(d.lng).toFixed(4)}`,
            date: new Date(d.timestamp).toLocaleString(),
            status,
            risk,
            color,
            confirmation,
            confColor,
            count,
            image_url: d.image_url,
            rawSeverity: d.severity,
          };
        });

        setIssuesData(formatted);
        setLoading(false);
        if (formatted.length > 0) {
          setSelectedIssue(formatted[0]); // default select the first one
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // ================= FILTER LOGIC =================
  const filteredIssues = issuesData.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.desc.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ? true : issue.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#f0f4f8] min-h-screen pb-14" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* HEADER */}
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
              City<span className="text-blue-600">Sense</span> <span className="text-slate-400 font-medium text-xs">Citizen</span>
            </span>
          </Link>

          <nav className="flex gap-6 text-sm font-semibold">
            <Link to="/citizen" className="text-slate-400 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span className="text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4">
              My Issues
            </span>
          </nav>

          <Link
            to="/"
            className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* TITLE */}
        <div className="cs-animate-in">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">My Submitted Sightings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time status tracking of urban incidents submitted by your device
          </p>
        </div>

        {/* ================= STATUS CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 cs-stagger">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 cs-animate-in" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 text-xl font-bold">🕒</div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm">Pending Review</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {issuesData.filter((i) => i.status === "Pending").length}
              </p>
              <span className="text-slate-400 text-xs font-medium">Awaiting administrator assignment</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 cs-animate-in" style={{ borderLeft: "4px solid #2563eb" }}>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-xl font-bold">🔄</div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm">Active In-Progress</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {issuesData.filter((i) => i.status === "In progress").length}
              </p>
              <span className="text-slate-400 text-xs font-medium">Assigned dispatch addressing defect</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 cs-animate-in" style={{ borderLeft: "4px solid #10b981" }}>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 text-xl font-bold">✔️</div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm">Closed / Resolved</h3>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {issuesData.filter((i) => i.status === "Resolved").length}
              </p>
              <span className="text-slate-400 text-xs font-medium">Completed and validated</span>
            </div>
          </div>
        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-4">
            {/* FILTER BOX */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5 cs-animate-in" style={{ animationDelay: "150ms" }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">Filter Sighting Logs</h4>
                  <input
                    type="text"
                    placeholder="Search by issue category or coordinates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full cs-input px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-400 bg-slate-50/50"
                  />
                </div>

                <div className="shrink-0">
                  <p className="font-bold text-slate-600 text-xs uppercase tracking-wider mb-2">Filter Status</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {["All", "Pending", "In progress", "Resolved"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          statusFilter === status
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                            : "border border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= ISSUE LIST ================= */}
            <div className="space-y-3 cs-animate-in" style={{ animationDelay: "200ms" }}>
              {loading && (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center">
                  <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span>
                  <p className="text-slate-400 text-sm mt-3 font-semibold">Retrieving telemetry data...</p>
                </div>
              )}

              {!loading && filteredIssues.length > 0 ? (
                filteredIssues.map((issue, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedIssue(issue)}
                    className={`cs-card p-5 flex justify-between items-center cursor-pointer transition-all duration-200 border ${
                      selectedIssue?.id === issue.id
                        ? "border-blue-500 bg-blue-50/20 shadow-md translate-x-1"
                        : "border-slate-200/60 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-800 capitalize text-base">
                          {issue.title}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${issue.confColor}`}>
                          Sighting: {issue.confirmation}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 font-medium mt-1 font-mono">
                        {issue.desc}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-2 font-semibold cs-mono">
                        SUBMITTED: {issue.date}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${issue.color}`}>
                        <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                        {issue.status}
                      </span>

                      <p className="text-xs text-slate-500 font-bold">
                        Risk: <span className={
                          issue.risk === "Critical"
                            ? "text-red-500"
                            : issue.risk === "High"
                            ? "text-orange-500"
                            : "text-amber-500"
                        }>{issue.risk}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                !loading && (
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-8 text-center text-slate-400 font-semibold text-sm">
                    No matching issue reports found.
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 h-fit sticky top-24 cs-animate-in" style={{ animationDelay: "250ms" }}>
            <h3 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Sighting Overview
            </h3>

            {selectedIssue ? (
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono">TITLE / CLASSIFICATION</span>
                  <h4 className="text-lg font-black text-slate-800 capitalize mt-0.5">{selectedIssue.title}</h4>
                </div>

                {selectedIssue.image_url ? (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono block mb-1">Visual Evidence</span>
                    <img
                      src={selectedIssue.image_url}
                      className="w-full h-44 object-cover rounded-xl border border-slate-200"
                      alt="Telemetry Sighting"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-xs text-slate-400 italic">
                    No visual evidence uploaded.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono block">GPS Telemetry</span>
                    <span className="text-xs font-semibold text-slate-600 block mt-1 font-mono break-all">{selectedIssue.desc}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono block">Submission Timestamp</span>
                    <span className="text-xs font-semibold text-slate-600 block mt-1 font-mono">{selectedIssue.date}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono block">Active Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mt-1 ${selectedIssue.color}`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cs-mono block">Risk Assessment</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block capitalize">{selectedIssue.risk}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">
                Select a reported incident card on the left to view comprehensive telemetry.
              </p>
            )}
          </div>
        </div>
      </main>

      <p className="text-center text-slate-400 font-semibold text-xs mt-12 mb-8">
        © 2026 CitySense AI — Smarter Urban Security
      </p>
    </div>
  );
}
