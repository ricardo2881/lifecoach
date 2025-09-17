import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Weekly from "./routes/Weekly";

// STOP old cached SW from serving stale code (safe to keep)
if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}

function Root() {
  return (
    <HashRouter>
      <div>
        <nav style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <Link to="/" style={{ marginRight: 12, fontWeight: 600 }}>Weekly Focus</Link>
          <a href="https://example.com" style={{ opacity: 0.6 }}>Test link</a>
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
