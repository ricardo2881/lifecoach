import React, { useEffect, useState } from "react";

type Outcome = { id: string; title: string; status: "planned" | "done" };
type MicroAction = { id: string; label: string; completed?: boolean };

export default function Weekly() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);
  const [remaining, setRemaining] = useState(120);
  const [running, setRunning] = useState(false);

  function addOutcome() {
    if (!newOutcome.trim()) return;
    if (outcomes.length >= 3) return alert("Keep it to 1–3 outcomes.");
    setOutcomes(o => [...o, { id: crypto.randomUUID(), title: newOutcome.trim(), status: "planned" }]);
    setNewOutcome("");
  }

  function createTodayAction() {
    if (!outcomes.length) return alert("Add an outcome first.");
    setTodayAction({ id: crypto.randomUUID(), label: `2-min move on: ${outcomes[0].title}` });
    setRemaining(120);
    setRunning(false);
  }

  // Simple 2-minute timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          setTodayAction(a => (a ? { ...a, completed: true } : a));
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Weekly Focus</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18 }}>Plan (pick 1–3 outcomes)</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newOutcome}
            onChange={e => setNewOutcome(e.target.value)}
            placeholder="Outcome…"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={addOutcome}>Add</button>
        </div>
        <ul style={{ marginTop: 8 }}>
          {outcomes.map(o => (
            <li key={o.id} style={{ padding: 8, border: "1px solid #eee", borderRadius: 8, marginTop: 6 }}>
              {o.title} <span style={{ opacity: .6, fontSize: 12 }}>({o.status})</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Do (today)</h2>
        {!todayAction ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ opacity: .7, fontSize: 14 }}>No micro-action for today.</span>
            <button onClick={createTodayAction}>Create one</button>
          </div>
        ) : (
          <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div style={{ marginBottom: 6 }}>{todayAction.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 20, marginBottom: 8 }}>
              {mm}:{ss}
            </div>
            {!running && remaining > 0 && <button onClick={() => setRunning(true)}>Start 2-min</button>}
            {running && <button onClick={() => setRunning(false)}>Pause</button>}
            {remaining === 0 && <div style={{ color: "green", marginTop: 6 }}>Nice! 2-minute action logged.</div>}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Review (Friday)</h2>
        <p style={{ opacity: .7, fontSize: 14 }}>Capture wins and set next week’s outcomes.</p>
      </section>
    </div>
  );
}
