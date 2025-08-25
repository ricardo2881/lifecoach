import React from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./AppShell";

const root = document.getElementById("root")!;
createRoot(root).render(<AppShell />);

window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.error("SW registration failed:", err));
  }
});
