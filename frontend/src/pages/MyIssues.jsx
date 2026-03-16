import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "https://citysenseai.onrender.com";

export default function MyIssues() {

  const [issuesData, setIssuesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ================= FETCH REAL BACKEND DATA =================
  useEffect(() => {

    fetch(`${API_BASE}/api/detections`)
      .then(res => res.json())
      .then(data => {

        const formatted = data.map(d => {

          // STATUS NORMALIZATION
          let status = "Pending";

          if (d.status === "Resolved") status = "Resolved";
          else if (d.status === "Open") status = "Pending";
          else if (d.status === "In progress") status = "In progress";

          // SEVERITY → RISK + COLOR
          let risk = "Moderate";
          let color = "bg-blue-100 text-blue-600";

          if (d.severity === "Critical") {
            risk = "Critical";
            color = "bg-red-100 text-red-600";
          }

          else if (d.severity === "High") {
            risk = "High";
            color = "bg-orange-100 text-orange-600";
          }

          else if (d.severity === "Medium") {
            risk = "Moderate";
            color = "bg-yellow-100 text-yellow-700";
          }

          return {
            title: d.type || "Reported Issue",
            desc: `Detected at Lat: ${d.lat}, Lng: ${d.lng}`,
            date: new Date(d.timestamp).toLocaleDateString(),
            status,
            risk,
            color
          };

        });

        setIssuesData(formatted);
        setLoading(false);

      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });

  }, []);

  // ================= FILTER LOGIC =================
  const filteredIssues = issuesData.filter(issue => {

    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.desc.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ? true : issue.status === statusFilter;

    return matchesSearch && matchesStatus;

  });

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HEADER */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">

          <h1 className="text-xl font-bold">CitySense AI</h1>

          <nav className="flex gap-6 text-sm">
            <Link to="/citizen" className="hover:text-blue-600">
              Dashboard
            </Link>

            <span className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">
              My Issues
            </span>
          </nav>

          <Link
            to="/"
            className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100"
          >
            Home
          </Link>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-6">

        {/* TITLE */}
        <h1 className="text-2xl font-bold">My Submitted Issues</h1>
        <p className="text-gray-600 text-sm">
          Track the status of issues you've reported
        </p>

        {/* ================= STATUS CARDS ================= */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">

          <div className="bg-white border rounded-xl p-5 shadow-sm flex gap-4">

            <div className="text-orange-500 text-xl">🕒</div>

            <div>
              <h3 className="font-semibold">Pending Review</h3>

              <p className="text-2xl font-bold">
                {issuesData.filter(i => i.status === "Pending").length}
              </p>

              <span className="text-gray-500 text-xs">
                Awaiting admin action
              </span>
            </div>

          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm flex gap-4">

            <div className="text-blue-500 text-xl">🔄</div>

            <div>
              <h3 className="font-semibold">In Progress</h3>

              <p className="text-2xl font-bold">
                {issuesData.filter(i => i.status === "In progress").length}
              </p>

              <span className="text-gray-500 text-xs">
                Being addressed
              </span>
            </div>

          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm flex gap-4">

            <div className="text-green-500 text-xl">✔️</div>

            <div>
              <h3 className="font-semibold">Resolved</h3>

              <p className="text-2xl font-bold">
                {issuesData.filter(i => i.status === "Resolved").length}
              </p>

              <span className="text-gray-500 text-xs">
                Completed
              </span>
            </div>

          </div>

        </div>

        {/* ================= MAIN GRID ================= */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">

          {/* LEFT SIDE */}
          <div className="md:col-span-2">

            {/* FILTER BOX */}
            <div className="bg-white border rounded-xl shadow-sm p-5 mb-4">

              <h4 className="font-semibold text-sm mb-2">Filter Issues</h4>

              <input
                type="text"
                placeholder="Search your submissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <div className="mt-3">

                <p className="font-semibold mb-1 text-sm">Status</p>

                <div className="flex gap-2 flex-wrap">

                  {["All","Pending","In progress","Resolved"].map(status => (

                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 rounded-lg text-xs ${
                        statusFilter === status
                          ? "bg-blue-600 text-white"
                          : "border"
                      }`}
                    >
                      {status}
                    </button>

                  ))}

                </div>

              </div>

            </div>

            {/* ================= ISSUE LIST ================= */}
            <div className="space-y-4">

              {loading && (
                <p className="text-center text-gray-500">
                  Loading your issues...
                </p>
              )}

              {!loading && filteredIssues.length > 0 ? (

                filteredIssues.map((issue, index) => (

                  <div
                    key={index}
                    className="bg-white border rounded-xl shadow-sm p-4 flex justify-between"
                  >

                    <div>

                      <h3 className="font-semibold capitalize">
                        {issue.title}
                      </h3>

                      <p className="text-sm text-gray-600">
                        {issue.desc}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {issue.date}
                      </p>

                    </div>

                    <div className="text-right">

                      <span
                        className={`${issue.color} px-3 py-1 rounded-full text-xs`}
                      >
                        {issue.status}
                      </span>

                      <p className="text-xs text-gray-600 mt-2">
                        Risk: {issue.risk}
                      </p>

                    </div>

                  </div>

                ))

              ) : (

                !loading && (
                  <p className="text-gray-500 text-sm">
                    No matching issues found.
                  </p>
                )

              )}

            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white border rounded-xl shadow-sm p-5 h-fit">

            <h3 className="font-semibold mb-3">Issue Details</h3>

            <p className="text-gray-500 text-sm">
              Select an issue to view details
            </p>

          </div>

        </div>

      </main>

      <p className="text-center text-gray-500 text-sm mt-10 mb-8">
        ©2026 CitySense AI
      </p>

    </div>
  );
}
