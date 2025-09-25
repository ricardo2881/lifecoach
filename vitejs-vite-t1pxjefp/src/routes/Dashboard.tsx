import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, Outcome, Week } from "../data/store";
import { isoWeekId, startOfWeekISO, endOfWeekISO } from "../utils/date";

// Example placeholders – keep your existing dashboard imports/components here
// import Streaks from "../components/Streaks";
// import Charts from "../components/Charts";

export default function Dashboard() {
  const [week, setWeek] = useState<Week | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  // Load current week and outcomes
  useEffect(() => {
    (async () => {
      const id = isoWeekId(new Date());
      let w = await db.weeks.get(id);
      if (!w) {
        w = {
          id,
          startsAt: startOfWeekISO(new Date()),
          endsAt: endOfWeekISO(new Date())
        };
        await db.weeks.put(w);
      }
      setWeek(w);

      const outs = await db.outcomes.where("weekId").equals(id).toArray();
      setOutcomes(outs);
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Ricardo – Life Optimization</h1>

      {/* --- Weekly Focus Card --- */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          marginTop: 16,
          background: "#f9f9f9"
        }}
      >
        <h2 style={{ marginTop: 0 }}>This Week’s Focus</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          {week?.startsAt} – {week?.endsAt}
        </p>

        {outcomes.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No outcomes set yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {outcomes.map((o) => (
              <li
                key={o.id}
                style={{
                  marginBottom: 4,
                  textDecoration: o.status === "done" ? "line-through" : "none"
                }}
              >
                {o.title}{" "}
                <span style={{ fontSize: 12, opacity: 0.6 }}>({o.status})</span>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 12 }}>
          <Link to="/weekly">
            <button
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              Open Weekly Focus →
            </button>
          </Link>
        </div>
      </section>

      {/* --- Your existing dashboard content below --- */}
      <section style={{ marginTop: 24 }}>
        <h2>Daily reflection</h2>
        <p>
          Did I meditate, do morning strength, hit 10k steps, log
          family/solo fun, and set my stress for today?
        </p>
        {/* Keep your KPI rings, streaks, charts, etc. here */}
      </section>
    </div>
  );
}
