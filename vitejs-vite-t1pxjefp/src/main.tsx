// vitejs-vite-t1pxjefp/src/main.tsx
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./routes/Dashboard";
import Weekly from "./routes/Weekly";

function Root() {
  return (
    <HashRouter>
      <div>
        {/* Simple top nav */}
        <nav style={{
          padding: 12, borderBottom: "1px solid #eee",
          display: "flex", gap: 12, alignItems: "center"
        }}>
          <Link to="/" style={{ fontWeight: 700 }}>Dashboard</Link>
          <Link to="/weekly">Weekly Focus</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/weekly" element={<Weekly />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

const root = document.getElementById("root")!;
createRoot(root).render(<Root />);

// keep SW clean during dev
if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}
