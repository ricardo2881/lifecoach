import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import LifeCoachApp from "./LifeCoachApp";
import LowTechPWAGuide from "./LowTechPWAGuide";
import Notes from "./routes/Notes";

const INDIGO = "#6366f1";
const INDIGO_LIGHT = "#e0e7ff";
const SURFACE = "#ffffff";
const BG = "#f5f6fa";
const TEXT = "#1e293b";
const MUTED = "#94a3b8";

function TopBar() {
  return (
    <div style={{
      background: SURFACE,
      borderBottom: "1px solid #e2e8f0",
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 30,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>🏃</span>
        <span style={{ fontWeight: 800, fontSize: 17, color: TEXT, letterSpacing: "-0.3px" }}>
          Ricardo · Life OS
        </span>
      </div>
      <a href="/" style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>Refresh</a>
    </div>
  );
}

function BottomNav() {
  const loc = useLocation();

  const tabs = [
    { to: "/", label: "Dashboard", icon: "📊" },
    { to: "/notes", label: "Notes", icon: "📓" },
    { to: "/guide", label: "Guide", icon: "📖" },
  ];

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: SURFACE,
      borderTop: "1px solid #e2e8f0",
      display: "flex",
      zIndex: 40,
      boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(tab => {
        const active = tab.to === "/"
          ? loc.pathname === "/"
          : loc.pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0 8px",
              textDecoration: "none",
              color: active ? INDIGO : MUTED,
              fontWeight: active ? 700 : 400,
              fontSize: 11,
              borderTop: active ? `2px solid ${INDIGO}` : "2px solid transparent",
              background: active ? INDIGO_LIGHT : "transparent",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 20, marginBottom: 2 }}>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <TopBar />
        <div style={{ paddingBottom: 80 }}>
          <Routes>
            <Route path="/" element={<LifeCoachApp />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/guide" element={<LowTechPWAGuide />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
