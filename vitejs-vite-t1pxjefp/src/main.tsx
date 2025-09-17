import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Weekly from "./routes/Weekly";

function Root() {
  return (
    <HashRouter>
      <div>
        <nav style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <Link to="/" style={{ marginRight: 12, fontWeight: 600 }}>Weekly Focus</Link>
          <Link to="/weekly">Weekly</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Weekly />} />
          <Route path="/weekly" element={<Weekly />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

const root = document.getElementById("root")!;
createRoot(root).render(<Root />);
if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}
