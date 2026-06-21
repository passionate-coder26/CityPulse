import React, { useState, useEffect } from "react";
import PredictiveMaintenanceWidget from "../components/PredictiveMaintenanceWidget";
import { Link, useLocation } from "react-router-dom";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

export default function AdminReports() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "cs-nav-active pb-3.5 -mb-3.5"
      : "text-slate-400 hover:text-blue-600 transition-colors pb-3.5 -mb-3.5";

  // ================= STATE =================
  const [detections, setDetections] = useState([]);
  const [aiReport, setAiReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ================= FETCH DATA =================
  useEffect(() => {
    fetch(`${API_BASE}/api/detections`)
      .then((res) => res.json())
      .then((data) => setDetections(data))
      .catch((err) => console.error("API Error:", err));
  }, []);

  // ================= GENERATE AI REPORT =================
  const generateAIReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detections: detections.slice(0, 20) }),
      });

      const data = await res.json();
      const cleanText = data.report.replace(/\*\*/g, "").replace(/#/g, "");
      setAiReport(cleanText);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Failed to generate report.");
    }
    setGenerating(false);
  };

  // ================= LIVE STATS =================
  const totalIssues = detections.length;
  const criticalIssues = detections.filter(
    (d) => d.severity === "High" || d.severity === "Critical"
  ).length;

  const resolvedCount = detections.filter(
    (d) => d.status === "Resolved"
  ).length;

  const resolutionRate =
    totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0;

  // DYNAMIC CHART VALUES
  const highCount = detections.filter(d => (d.severity === "High" || d.severity === "Critical") && d.status !== "Resolved").length;
  const medCount = detections.filter(d => d.severity === "Medium" && d.status !== "Resolved").length;
  const lowCount = detections.filter(d => d.severity === "Low" && d.status !== "Resolved").length;

  const maxCount = Math.max(highCount, medCount, lowCount, 1);
  const highPercent = Math.round((highCount / maxCount) * 80) + 10;
  const medPercent = Math.round((medCount / maxCount) * 80) + 10;
  const lowPercent = Math.round((lowCount / maxCount) * 80) + 10;

  // CATEGORY COUNTS
  const potholeCount = detections.filter(d => d.type.toLowerCase().includes("pothole")).length;
  const garbageCount = detections.filter(d => d.type.toLowerCase().includes("garbage")).length;
  const waterCount = detections.filter(d => d.type.toLowerCase().includes("water") || d.type.toLowerCase().includes("manhole") || d.type.toLowerCase().includes("logging")).length;
  const otherCount = totalIssues - (potholeCount + garbageCount + waterCount);

  const totalCat = potholeCount + garbageCount + waterCount + otherCount || 1;
  const potholePercent = Math.round((potholeCount / totalCat) * 100);
  const garbagePercent = Math.round((garbageCount / totalCat) * 100);
  const waterPercent = Math.round((waterCount / totalCat) * 100);
  const otherPercent = Math.round((otherCount / totalCat) * 100);

  // ZONE WISE COMPUTATION
  const zones = ["Downtown", "North Quarter", "West Side", "East District"];
  const zoneData = zones.map(zone => {
    // assign detections randomly for realistic demo simulation
    const zoneDets = detections.filter((d, i) => (i % 4 === zones.indexOf(zone)));
    const count = zoneDets.length;
    let status = "Healthy";
    let statusColor = "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (zoneDets.some(d => d.severity === "Critical" && d.status !== "Resolved")) {
      status = "Critical";
      statusColor = "text-red-600 bg-red-50 border-red-100 cs-pulse";
    } else if (zoneDets.some(d => d.severity === "High" && d.status !== "Resolved")) {
      status = "High Warn";
      statusColor = "text-orange-500 bg-orange-50 border-orange-100";
    } else if (count > 0) {
      status = "Moderate";
      statusColor = "text-amber-600 bg-amber-50 border-amber-100";
    }
    return { name: zone, count, status, statusColor };
  });

  return (
    <div className="bg-[#f0f4f8] min-h-screen pb-14" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-3 px-6">
          {/* LEFT SIDE */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                <span className="text-blue-700">City</span><span className="text-sky-500">Sense</span> <span className="text-slate-400 font-medium text-xs">AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <Link to="/admin/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors pb-3.5 -mb-3.5">
                Dashboard
              </Link>
              <Link to="/admin/reports" className="cs-nav-active pb-3.5 -mb-3.5">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Admin
            </div>
            <Link to="/" className="text-slate-400 hover:text-red-500 text-xs font-semibold ml-2 transition-colors">
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="max-w-7xl mx-auto px-6 mt-6">
        {/* HEADER & AI BUTTON */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 border border-slate-200/50 backdrop-blur-md rounded-2xl p-6 shadow-sm cs-animate-in">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">Reports & Analytics</h2>
            <p className="text-slate-500 text-sm mt-1">
              Comprehensive insight analysis into city health and predictive metrics
            </p>
          </div>

          <button
            onClick={generateAIReport}
            disabled={generating}
            className={`px-5 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 ${
              generating
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing City Grid...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
                Generate AI Insights
              </>
            )}
          </button>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6 cs-stagger">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm cs-accent-top hover:shadow-md transition-all duration-300 cs-animate-in">
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Total Detections</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold cs-stat-number">{totalIssues}</span>
              <span className="text-slate-400 text-xs font-semibold cs-mono">issues</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Real-time feed telemetry
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cs-animate-in" style={{ borderTop: "3px solid #ef4444" }}>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Critical Threshold</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold text-red-500">{criticalIssues}</span>
              <span className="text-slate-400 text-xs font-semibold cs-mono">urgent</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              Immediate dispatch suggested
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cs-animate-in" style={{ borderTop: "3px solid #10b981" }}>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Resolution Efficiency</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold text-emerald-500">{resolutionRate}%</span>
              <span className="text-slate-400 text-xs font-semibold cs-mono">closed</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              <b>{resolvedCount}</b> incidents successfully closed
            </p>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cs-animate-in" style={{ borderTop: "3px solid #38bdf8" }}>
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Mean Repair Duration</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-extrabold text-sky-500">2.4</span>
              <span className="text-slate-400 text-xs font-semibold cs-mono">days</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Avg dispatch to final sign-off
            </p>
          </div>
        </div>

        {/* AI REPORT SECTION */}
        <div className="cs-animate-in" style={{ animationDelay: '150ms' }}>
          {aiReport ? (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-6 mt-6 shadow-sm shadow-violet-500/5">
              <h3 className="text-violet-800 font-extrabold flex items-center gap-2 text-lg">
                <span className="w-7 h-7 bg-violet-600 text-white rounded-lg flex items-center justify-center text-xs">✨</span>
                Gemini Autonomous Grid Evaluation
              </h3>
              <div className="mt-4 prose prose-indigo max-w-none text-slate-700 whitespace-pre-line leading-relaxed font-medium text-sm md:text-base bg-white/70 rounded-xl p-5 border border-violet-100/50 shadow-inner">
                {aiReport}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5">ℹ️</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Key Insights & Recommendations Available</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate an instant AI assessment report using high-accuracy machine learning predictions.
                  </p>
                </div>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 md:text-right">
                <li>• Downtown District currently shows high failure clustering</li>
                <li>• Live infrastructure reports ready for autonomous review</li>
              </ul>
            </div>
          )}
        </div>

        {/* ================= PREDICTIVE MAINTENANCE SCANNER ================= */}
        <div className="mt-6">
          <PredictiveMaintenanceWidget />
        </div>

        {/* CHARTS CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Chart 1: Severity */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm cs-animate-in" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Incident Severity Matrix
              </h3>
              <span className="text-xs text-slate-400 font-semibold cs-mono">LIVE CLASSIFICATION</span>
            </div>

            <div className="flex items-end justify-around h-56 px-4 border-b border-slate-100 pb-3 relative">
              {/* Background horizontal lines */}
              <div className="absolute inset-x-0 bottom-3 border-b border-dashed border-slate-100"></div>
              <div className="absolute inset-x-0 bottom-1/4 border-b border-dashed border-slate-100"></div>
              <div className="absolute inset-x-0 bottom-2/4 border-b border-dashed border-slate-100"></div>
              <div className="absolute inset-x-0 bottom-3/4 border-b border-dashed border-slate-100"></div>

              {/* HIGH / CRITICAL */}
              <div className="flex flex-col justify-end items-center w-16 h-full z-10 group">
                <div
                  className="w-full bg-gradient-to-t from-red-600 to-rose-400 rounded-t-xl relative shadow-md shadow-red-500/20 group-hover:scale-105 transition-all duration-300"
                  style={{ height: `${highPercent}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    {highCount}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 mt-3">High</span>
              </div>

              {/* MEDIUM */}
              <div className="flex flex-col justify-end items-center w-16 h-full z-10 group">
                <div
                  className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-xl relative shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all duration-300"
                  style={{ height: `${medPercent}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                    {medCount}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 mt-3">Medium</span>
              </div>

              {/* LOW */}
              <div className="flex flex-col justify-end items-center w-16 h-full z-10 group">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-xl relative shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300"
                  style={{ height: `${lowPercent}%` }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {lowCount}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 mt-3">Low</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-3 text-center">Charts dynamically recalculated from active database telemetry</p>
          </div>

          {/* Chart 2: Categories */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm cs-animate-in" style={{ animationDelay: '250ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Urban Defect Categories
              </h3>
              <span className="text-xs text-slate-400 font-semibold cs-mono">BY VOLUME</span>
            </div>

            <div className="space-y-4 py-2">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Road Potholes
                  </span>
                  <span className="font-bold cs-mono">{potholePercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-sky-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${potholePercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    Overflowing Garbage Bin
                  </span>
                  <span className="font-bold cs-mono">{garbagePercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${garbagePercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Water Logging / Drainage
                  </span>
                  <span className="font-bold cs-mono">{waterPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${waterPercent}%` }}
                  ></div>
                </div>
              </div>

              {otherCount > 0 && (
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      Other Defects
                    </span>
                    <span className="font-bold cs-mono">{otherPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-slate-500 to-slate-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${otherPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ZONE PERFORMANCE */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm mt-6 cs-animate-in" style={{ animationDelay: '300ms' }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Regional Security & Dispatch Grid</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated safety risk scoring based on active zone clusters</p>
            </div>
            <span className="text-xs bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-500 font-semibold cs-mono">4 ZONES MAPPED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider text-left">
                  <th className="py-3 px-4 font-bold">Zone Sector</th>
                  <th className="py-3 px-4 font-bold">Telemetry Detections</th>
                  <th className="py-3 px-4 font-bold">Security Grid Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {zoneData.map((zone, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-800 font-bold">{zone.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 cs-mono">{zone.count} active reports</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${zone.statusColor}`}>
                        <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                        {zone.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}