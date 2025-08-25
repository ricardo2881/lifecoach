import React, { useState } from "react";
import { Share2, Copy } from "lucide-react";

export default function LowTechPWAGuide() {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/guide`;

  async function doShareOrCopy() {
    const data = { title: "Install Guide", text: "PWA Mobile Install Guide", url };
    const navAny = navigator as any;
    if (navAny.share) {
      try {
        await navAny.share(data);
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const box = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff"
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Mobile install guide</div>
        <button
          onClick={doShareOrCopy}
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#eef2ff", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          title="Share or copy"
        >
          <Share2 size={16} />
          <Copy size={16} />
          Share/Copy
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div style={box as any}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>iPhone (Safari)</div>
        <ol>
          <li>Open the app URL in Safari.</li>
          <li>Tap the Share button.</li>
          <li>Tap Add to Home Screen.</li>
          <li>Tap Add.</li>
          <li>Open the app from the new home screen icon.</li>
        </ol>
      </div>

      <div style={{ height: 8 }} />

      <div style={box as any}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Android (Chrome)</div>
        <ol>
          <li>Open the app URL in Chrome.</li>
          <li>Tap the menu (3 dots).</li>
          <li>Choose Install App or Add to Home Screen.</li>
          <li>Tap Install.</li>
          <li>Open from the icon or app drawer.</li>
        </ol>
      </div>

      <div style={{ height: 8 }} />

      <div style={box as any}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Share or copy this guide link</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input readOnly value={url} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #cbd5e1" }} />
          <button onClick={doShareOrCopy} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>
            {copied ? "Copied" : "Share/Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
