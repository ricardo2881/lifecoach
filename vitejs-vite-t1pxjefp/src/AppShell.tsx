import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import LifeCoachApp from "./LifeCoachApp";
import LowTechPWAGuide from "./LowTechPWAGuide";

function Nav() {
  const loc = useLocation();
  const tabStyle = (active: boolean) => ({
    padding: "10px 14px",
    borderRadius: 8,
    background: active ? "#e5e7ff" : "transparent",
    color: "#1e293b",
    fontWeight: 600,
    border: "1px solid " + (active ? "#c7d2fe" : "transparent")
  });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Ricardo - Life Optimization</div>
        <Link to="/" style={tabStyle(loc.pathname === "/")}>Dashboard</Link>
        <Link to="/guide" style={tabStyle(loc.pathname === "/guide")}>Install Guide</Link>
      </div>
      <a href="/" style={{ fontSize: 12 }}>Refresh</a>
    </div>
  );
}

export default function AppShell() {
  return (
    <BrowserRouter>
      <div className="container">
        <Nav />
        <div style={{ height: 12 }} />
        <Routes>
          <Route path="/" element={<LifeCoachApp />} />
          <Route path="/guide" element={<LowTechPWAGuide />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
