import { Routes, Route, Link } from "react-router-dom";
import CitizenPortal from "./pages/CitizenPortal";
import MyIssues from "./pages/MyIssues";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminIssues from "./pages/AdminIssues";
import AdminReports from "./pages/AdminReports";
import CitizenScanner from "./pages/CitizenScanner";

export default function App() {
  return (
    <Routes>

      {/* LANDING PAGE (Home /) */}
      <Route
        path="/"
        element={
          <div className="bg-[#f0f4f8] text-slate-900 min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Navbar */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight">
                    <span className="text-blue-700">City</span><span className="text-sky-500">Pulse</span> <span className="text-slate-400 font-medium text-sm">AI</span>
                  </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                  <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
                  <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
                </nav>

                <div className="flex items-center gap-3">
                  <Link to="/citizen">
                    <button className="border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300">
                      Citizen
                    </button>
                  </Link>
                  <Link to="/admin">
                    <button className="cs-btn-primary px-5 py-2.5 rounded-xl text-sm">
                      Admin Portal
                    </button>
                  </Link>
                </div>
              </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto flex flex-col md:flex-row items-center py-20 px-6 mt-6 gap-14">
              <div className="flex-1 cs-animate-in">
                <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-blue-100">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Predictive Civic Intelligence
                </span>

                <h2 className="text-5xl md:text-6xl font-extrabold mt-6 leading-[1.1] tracking-tight">
                  From Reactive to <br />
                  <span className="cs-gradient-text">Proactive Urban</span> <br />
                  Governance
                </h2>

                <p className="mt-6 max-w-xl text-slate-500 text-lg leading-relaxed">
                  <span className="font-semibold text-slate-700">CityPulse AI</span> scans urban environments using
                  <span className="font-semibold text-blue-600"> smart sensors</span> and
                  <span className="font-semibold text-blue-600"> AI vision</span> to detect hidden, unreported, and early-stage
                  civic issues <span className="font-semibold text-slate-700">before they escalate.</span>
                </p>

                <div className="flex flex-wrap gap-4 mt-8">
                  <Link to="/admin">
                    <button className="cs-btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Admin Portal
                    </button>
                  </Link>

                  <Link to="/scanner">
                    <button className="bg-gradient-to-r from-violet-600 to-purple-500 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v-1a2 2 0 0 1 2-2h2"/><path d="M19 1h2a2 2 0 0 1 2 2v1"/><path d="M23 19v2a2 2 0 0 1-2 2h-2"/><path d="M5 23H3a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="16"/></svg>
                      Try AR Scanner
                    </button>
                  </Link>

                  <Link to="/citizen">
                    <button className="border border-slate-200 bg-white px-6 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Citizen Portal
                    </button>
                  </Link>
                </div>

                <p className="text-slate-400 mt-4 text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Real-time civic intelligence. Safer cities.
                </p>
              </div>

              <div className="flex-1 cs-animate-in" style={{ animationDelay: '200ms' }}>
                <div className="relative">
                  {/* Decorative glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-sky-500/10 to-blue-500/10 rounded-3xl blur-2xl"></div>
                  <div className="relative h-80 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-white border border-blue-100/50 flex flex-col items-center justify-center overflow-hidden shadow-lg">
                    {/* Grid pattern */}
                    <div className="absolute inset-0 cs-grid-bg opacity-60"></div>
                    {/* Animated city graphic */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="text-7xl mb-3" style={{ filter: 'drop-shadow(0 4px 12px rgba(37,99,235,0.2))' }}>🏙️</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-sm font-semibold text-blue-600 cs-mono">MONITORING ACTIVE</span>
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      </div>
                      <div className="flex gap-6 mt-4 text-xs text-slate-400 cs-mono">
                        <span>CAM:24</span>
                        <span>SENSORS:48</span>
                        <span>ZONES:12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-20 cs-grid-bg" id="how-it-works">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center cs-animate-in">
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100 mb-4">
                    PLATFORM
                  </span>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    How <span className="cs-gradient-text">CityPulse AI</span> Works
                  </h2>
                  <p className="text-slate-500 mt-3 max-w-lg mx-auto">
                    Four powerful layers working together to transform urban governance
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-14 cs-stagger" id="features">
                  {[
                    { icon: "📡", title: "Data Collection", desc: "Passive ingestion from street cameras & IoT sensors across the city grid.", color: "from-blue-500 to-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                    { icon: "🧠", title: "AI Insights", desc: "Vision AI detects potholes, garbage, streetlight failures & more.", color: "from-violet-500 to-purple-600", bg: "bg-violet-50", border: "border-violet-100" },
                    { icon: "📊", title: "Prediction", desc: "Risk scoring and trend analysis predicts failures before they escalate.", color: "from-amber-500 to-orange-500", bg: "bg-amber-50", border: "border-amber-100" },
                    { icon: "⚡", title: "Action", desc: "Smart dashboards auto-trigger maintenance crews & resource allocation.", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                  ].map((item, i) => (
                    <div key={i} className={`cs-card p-6 relative overflow-hidden group cursor-default cs-animate-in`}>
                      <div className={`w-12 h-12 ${item.bg} ${item.border} border rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon}
                      </div>
                      <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                      <p className="text-slate-500 mt-2 text-sm leading-relaxed">{item.desc}</p>
                      {/* Step number */}
                      <div className="absolute top-4 right-4 text-xs font-bold text-slate-200 cs-mono">0{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400 py-14">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">CityPulse AI</h3>
                </div>
                <p className="text-sm text-slate-500">Smarter cities through predictive intelligence.</p>
                <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-600">
                  <Link to="/citizen" className="hover:text-blue-400 transition-colors">Citizen Portal</Link>
                  <Link to="/admin" className="hover:text-blue-400 transition-colors">Admin Portal</Link>
                  <Link to="/scanner" className="hover:text-blue-400 transition-colors">AR Scanner</Link>
                </div>
                <p className="text-slate-600 text-xs mt-6">© 2026 CityPulse AI — All Rights Reserved</p>
              </div>
            </footer>
          </div>
        }
      />

      {/* === APP ROUTES === */}
      <Route path="/citizen" element={<CitizenPortal />} />
      <Route path="/my-issues" element={<MyIssues />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/issues" element={<AdminIssues />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="/scanner" element={<CitizenScanner />} />

    </Routes>
  );
}