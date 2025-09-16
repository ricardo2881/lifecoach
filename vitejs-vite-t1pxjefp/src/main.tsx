import React from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";
import Weekly from './routes/Weekly';

const root = document.getElementById("root")!;
createRoot(root).render(<AppShell />);

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.error("SW registration failed:", err));
  }
  <Route path="/weekly" element={<Weekly />} />
<nav className="p-3 border-b">
  <a href="/" className="mr-3">Dashboard</a>
  <a href="/weekly">Weekly</a>
</nav>

});

