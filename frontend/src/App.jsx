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
          <div className="bg-white text-gray-900">

            {/* Navbar */}
            <header className="border-b">
              <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
                <h1 className="text-xl font-bold">CitySense AI</h1>

                <nav className="space-x-6 hidden md:block">
                  <span className="cursor-pointer hover:text-blue-600">Features</span>
                  <span className="cursor-pointer hover:text-blue-600">About</span>
                </nav>

                <div className="space-x-3">
                  <Link to="/citizen">
                    <button className="border px-4 py-2 rounded-lg hover:bg-gray-100">
                      Citizen
                    </button>
                  </Link>
                  <Link to="/admin">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                      Admin
                    </button>
                  </Link>
                </div>
              </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto flex flex-col md:flex-row items-center py-20 px-6 mt-15 gap-10 ">
              <div className="flex-1">
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  Predictive Civic Intelligence
                </span>

                <h2 className="text-4xl md:text-5xl font-bold mt-4 leading-tight">
                  From Reactive to <br />
                  Proactive Urban <br />
                  Governance
                </h2>

                <p className="mt-4 max-w-xl text-gray-700 text-lg md:text-xl leading-relaxed tracking-wide">
                  <span className="font-semibold text-gray-900">CitySense AI</span> scans urban environments using
                  <span className="font-semibold text-blue-600"> smart sensors</span> and
                  <span className="font-semibold text-blue-600"> AI vision</span> to detect hidden, unreported, and early-stage
                  civic issues <span className="font-semibold text-gray-900">before they escalate.</span>
                </p>

                <div className="flex gap-4 mt-5">
                  <Link to="/admin">
                    <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
                      Admin Portal
                    </button>
                  </Link>

                  <Link to="/scanner">
                    <button className="bg-purple-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-purple-700 transition flex items-center gap-2">
                      <span>👁️</span> Try AR Scanner
                    </button>
                  </Link>

                  <Link to="/citizen">
                    <button className="border px-5 py-2 rounded-lg">
                      Citizen Portal
                    </button>
                  </Link>
                </div>

                <p className="text-gray-500 mt-3">
                  Real-time civic intelligence. Safer cities.
                </p>
              </div>

              <div className="flex-1">
                <div className="h-72 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <div className="text-6xl">🏙️</div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-16 mt-15">
              <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center">
                  How CitySense AI Works
                </h2>
                <p className="text-gray-600 text-center mt-3">
                  Four powerful layers working together to transform urban governance
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
                  <div className="border rounded-2xl p-6 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg mb-4"></div>
                    <h3 className="font-bold text-lg">Data Collection</h3>
                    <p className="text-gray-600 mt-2 text-sm">Passive ingestion from street cameras & sensors.</p>
                  </div>

                  <div className="border rounded-2xl p-6 shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg mb-4"></div>
                    <h3 className="font-bold text-lg">AI Insights</h3>
                    <p className="text-gray-600 mt-2 text-sm">Vision AI detects potholes & failures.</p>
                  </div>

                  <div className="border rounded-2xl p-6 shadow-sm">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg mb-4"></div>
                    <h3 className="font-bold text-lg">Prediction</h3>
                    <p className="text-gray-600 mt-2 text-sm">Risk scoring predicts failures early.</p>
                  </div>

                  <div className="border rounded-2xl p-6 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-lg mb-4"></div>
                    <h3 className="font-bold text-lg">Action</h3>
                    <p className="text-gray-600 mt-2 text-sm">Smart dashboards trigger maintenance.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-300 py-10">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <h3 className="text-xl font-bold text-white">CitySense AI</h3>
                <p className="mt-2 text-sm">Smarter cities through predictive intelligence.</p>
                <p className="text-gray-500 text-sm mt-6">© 2025 CitySense AI — All Rights Reserved</p>
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