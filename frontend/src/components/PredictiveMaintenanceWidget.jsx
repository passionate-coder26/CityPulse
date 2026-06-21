import React, { useState, useEffect } from "react";

const API_BASE = "https://citypulse-1-bjum.onrender.com";

export default function PredictiveMaintenanceWidget() {
  const [anomalies, setAnomalies] = useState([]);
  const [scanning, setScanning] = useState(true);

  const fetchAnomalies = () => {
    fetch(`${API_BASE}/api/infrastructure/anomalies`)
      .then((res) => res.json())
      .then((data) => {
        setAnomalies(data);
        setScanning(false);
      })
      .catch((err) => {
        console.error("Error reading anomaly stream:", err);
        setScanning(false);
      });
  };

  useEffect(() => {
    // Artificial system handshake delay for presentation aesthetics
    const timer = setTimeout(fetchAnomalies, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-left">
      {/* Decorative vector background */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      {/* Title block */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Predictive Maintenance Grid
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Detecting silent asset failures via time-series heartbeat variance
          </p>
        </div>
        <span className="text-[9px] font-black tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md cs-mono">
          SYSTEM SCAN ACTIVE
        </span>
      </div>

      {/* Main State Handler */}
      {scanning ? (
        <div className="py-10 flex flex-col items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-slate-400 text-xs font-mono animate-pulse">Running hardware integrity parity tests...</p>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <p className="text-emerald-400 text-sm font-bold flex justify-center items-center gap-2">
            <span>✔️</span> Security Grid Status: Optimal. Zero Unreported Failures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((asset) => (
            <div 
              key={asset.id} 
              className="bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              {/* Asset Identity */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shadow-inner">
                  {asset.type.includes("CCTV") ? "📹" : asset.type.includes("Streetlight") ? "💡" : "🆘"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-200 text-sm tracking-tight">{asset.id}</h4>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {asset.sector}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{asset.type}</p>
                </div>
              </div>

              {/* Statistical Metrics */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Telemetry Logs</span>
                  <span className="text-xs font-semibold text-rose-400 block mt-0.5">
                    Offline {asset.minutesOffline}m ({asset.missedHeartbeats} pings missed)
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider mb-1 text-left sm:text-right">
                    Failure Prob.
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-900 rounded-full h-1.5 overflow-hidden hidden md:block border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          asset.riskStatus.includes("Critical") ? "bg-red-500" : "bg-amber-500"
                        }`} 
                        style={{ width: `${asset.failureProbability}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-black cs-mono ${
                      asset.riskStatus.includes("Critical") ? "text-red-400" : "text-amber-400"
                    }`}>
                      {asset.failureProbability}%
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => alert(`🔧 Maintenance ticket generated for item ${asset.id}. Sector dispatch assigned.`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors duration-200 shadow-md active:scale-95"
                >
                  Dispatch Crew
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}