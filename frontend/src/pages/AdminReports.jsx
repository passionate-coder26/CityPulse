import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const API_BASE = "https://citysenseai.onrender.com";

export default function AdminReports() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 font-semibold relative after:content-[''] after:w-full after:h-[2px] after:bg-blue-600 after:absolute after:-bottom-1 after:left-0"
      : "text-gray-700 hover:text-blue-600";

  // ================= STATE =================
  const [detections, setDetections] = useState([]);
  const [aiReport, setAiReport] = useState(null);
  const [generating, setGenerating] = useState(false);

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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="w-full border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
          <Link to="/" className="text-black-600 text-xl font-bold">
            CitySense AI
          </Link>

          <nav className="flex-1 flex justify-center">
            <ul className="flex items-center gap-10 font-medium">
              <li>
                <Link
                  to="/admin/dashboard"
                  className={isActive("/admin/dashboard")}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/issues"
                  className={isActive("/admin/issues")}
                >
                  Issues
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/reports"
                  className={isActive("/admin/reports")}
                >
                  Reports
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <button className="px-3 py-1 bg-blue-50 text-blue-700 border rounded-lg text-sm">
              👤 City Administrator
            </button>
            <Link to="/" className="text-red-500 text-sm">
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* HEADER & AI BUTTON */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <p className="text-gray-600 text-sm">
              Comprehensive insights into city health
            </p>
          </div>

          <button
            onClick={generateAIReport}
            disabled={generating}
            className={`px-4 py-2 rounded-md text-sm text-white transition-all ${
              generating
                ? "bg-gray-400"
                : "bg-purple-600 hover:bg-purple-700 shadow-md"
            }`}
          >
            {generating ? "🤖 Analyzing..." : "✨ Generate AI Insights"}
          </button>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-4 gap-5 mt-6">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm font-semibold">Total Issues</p>
            <p className="text-3xl font-bold mt-1">{totalIssues}</p>
            <p className="text-xs text-gray-500 mt-1">Live from sensors</p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm font-semibold">Critical Issues</p>
            <p className="text-3xl font-bold mt-1 text-red-500">
              {criticalIssues}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Immediate action required
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm font-semibold">Resolution Rate</p>
            <p className="text-3xl font-bold mt-1 text-green-500">
              {resolutionRate}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {resolvedCount} resolved
            </p>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm font-semibold">Avg Response Time</p>
            <p className="text-3xl font-bold mt-1 text-blue-500">2.4d</p>
            <p className="text-xs text-gray-500 mt-1">Days to resolution</p>
          </div>
        </div>

        {/* AI REPORT SECTION */}
        {aiReport ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mt-6 shadow-sm animate-fade-in">
            <h3 className="text-purple-800 font-bold flex items-center gap-2 text-lg">
              🤖 Gemini AI Analysis
            </h3>
            <div className="mt-4 prose prose-purple max-w-none text-gray-800 whitespace-pre-line leading-relaxed font-medium">
              {aiReport}
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border rounded-xl p-5 mt-6">
            <h3 className="font-semibold text-sm mb-2">
              Key Insights & Recommendations
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                • Click the <b>"Generate AI Insights"</b> button above to analyze
                live data.
              </li>
              <li>
                • Downtown District has historical high risks — prioritize
                resources.
              </li>
            </ul>
          </div>
        )}

        {/* CHARTS */}
        <div className="grid grid-cols-2 gap-5 mt-6">
          {/* Chart 1 */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">
              Live Severity Distribution
            </h3>
            <div className="flex items-end justify-between h-40 px-8 space-x-6 border-b pb-1">
              <div className="flex flex-col items-center w-full">
                <div
                  className="w-full bg-red-400 rounded-t-md relative hover:opacity-80 transition"
                  style={{ height: "65%" }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500">
                    High
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center w-full">
                <div
                  className="w-full bg-orange-400 rounded-t-md relative hover:opacity-80 transition"
                  style={{ height: "40%" }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-orange-500">
                    Med
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center w-full">
                <div
                  className="w-full bg-blue-400 rounded-t-md relative hover:opacity-80 transition"
                  style={{ height: "80%" }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-500">
                    Low
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Top Issue Categories</h3>
            <div className="space-y-5 mt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Potholes</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Garbage</span>
                  <span className="font-bold">30%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Water Logging</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-teal-400 h-2.5 rounded-full"
                    style={{ width: "25%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ZONE TABLE */}
        <div className="bg-white border rounded-xl p-5 mt-6">
          <h3 className="font-semibold text-sm mb-3">Zone-wise Performance</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Zone</th>
                <th className="text-left">Issues</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Downtown</td>
                <td>12</td>
                <td className="text-red-500 font-semibold">Critical</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">North Quarter</td>
                <td>8</td>
                <td className="text-orange-500">High</td>
              </tr>
              <tr>
                <td className="py-2">West Side</td>
                <td>5</td>
                <td className="text-yellow-600">Moderate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}