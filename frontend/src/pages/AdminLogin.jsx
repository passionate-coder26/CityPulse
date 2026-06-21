import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'linear-gradient(135deg, #f0f4f8 0%, #dbeafe 50%, #e0f2fe 100%)' }}>

      {/* Background grid */}
      <div className="fixed inset-0 cs-grid-bg opacity-40 pointer-events-none"></div>

      {/* HEADER */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/50 relative z-10">
        <div className="max-w-7xl mx-auto py-4 px-6 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 flex items-center justify-center shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-blue-700">City</span><span className="text-sky-500">Pulse</span> <span className="text-slate-400 font-medium text-xs">AI</span>
            </span>
          </Link>
        </div>
      </header>

      {/* CENTER LOGIN CARD */}
      <div className="flex-1 flex justify-center items-center px-4 relative z-10">
        <div className="cs-animate-in w-full max-w-md">
          {/* Decorative glow */}
          <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/10 via-sky-400/10 to-blue-500/10 rounded-3xl blur-2xl pointer-events-none"></div>

          <div className="relative bg-white border border-slate-200/60 shadow-xl shadow-blue-900/5 rounded-2xl p-8">
            {/* Top accent bar */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 rounded-b-full"></div>

            {/* ICON */}
            <div className="flex justify-center mb-5 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-800">Admin Portal</h2>
            <p className="text-center text-slate-400 text-sm mt-1">
              Secure access to CityPulse AI management console
            </p>

            {/* FORM */}
            <div className="mt-7 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="admin@citypulse.ai"
                  className="cs-input w-full px-4 py-3 mt-1.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="cs-input w-full px-4 py-3 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* SIGN IN */}
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="cs-btn-primary w-full py-3 rounded-xl text-sm mt-2 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </button>
            </div>

            {/* FOOTER */}
            <p className="text-center text-slate-400 text-sm mt-6">
              Not an admin?
              <Link to="/" className="text-blue-600 font-semibold ml-1 hover:text-blue-700 transition-colors">
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent relative z-10"></div>
    </div>
  );
}
