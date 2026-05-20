import React from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";

// Unregister old service workers to prevent stale cache issues
if ("serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
}

const root = document.getElementById("root")!;
createRoot(root).render(<AppShell />);
