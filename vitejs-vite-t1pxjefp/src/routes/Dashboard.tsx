// vitejs-vite-t1pxjefp/src/routes/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { db, Week, Outcome, MicroAction, Review } from "../data/store";
import { isoWeekId, startOfWeekISO, endOfWeekISO, todayISO, displayDateLong, displayDateTime } from "../utils/date";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [week, setWeek] = useState<Week | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);
  const [recentWins, setRecentWins] = useState<string[]>([]);
  const [reviewSavedOn, setReviewSavedOn] = useState<string>("");

  useEffect(() => {
    (async () => {
      const id = isoWeekId(new Date());

      // ensure week record exists
      let w = await db.weeks.get(id);
      if (!w) {
        w = { id, startsAt: startOfWeekISO(new Date()), endsAt: endOfWeekISO(new Date()) };
        await db.weeks.put(w);
      }
      setWeek(w);

      // load outcomes
      const outs = await db.outcomes.where("weekId").equals(w.id).toArray();
      setOutcomes(outs);

      // load today's action (first, if any)
      const today = await db.actions.where("date").equals(todayISO()).toArray();
      setTodayAction(today[0] ?? null);

      // load review + wins
      const rev = await db.reviews.get(w.id);
      if (rev?.wins?.length) setRecentWins(rev.wins.slice(-3).reverse());
      if (rev?.notes) setReviewSavedOn(todayISO()); // simple stamp for “saved today”
    })();
  }, []);

  const total = outcomes.length;
  const done = outcomes.filter(o => o.status === "done").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ opacity: 0.7, marginTop: 6 }}>
            {displayDateLong(week?.startsAt)}{" — "}{displayDateLong(week?.endsAt)}
          </p>
        </div>
        <Link to="/weekly">
          <button>Open Weekly Focus →</button>
        </Link>
      </header>

      {/* Outcome progress */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Outcome progress</h2>
          <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "#f2f4f7" }}>
            {done} of {total} done ({progress}%)
          </span>
        </div>

        <div style={{ marginTop: 8, height: 10, background: "#f2f4f7", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#22c55e" }} />
        </div>

        <ul style={{ marginTop: 10 }}>
          {outcomes.map(o => (
            <li key={o.id} style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{
                fontSize: 12, padding: "2px 8px", borderRadius: 999,
                background: o.status === "done" ? "#e8ffe8" : o.status === "in_progress" ? "#e6f2ff" : "#fafafa",
                border: "1px solid #e5e7eb", minWidth: 90, textAlign: "center"
              }}>
                {o.status === "done" ? "done ✅" : o.status === "in_progress" ? "in progress" : "planned"}
              </span>
              <span>{o.title}</span>
            </li>
          ))}
          {outcomes.length === 0 && <li style={{ opacity: 0.7 }}>No outcomes yet.</li>}
        </ul>
      </section>

      {/* Today’s micro-action */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Today</h2>
        {!todayAction ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ opacity: 0.7 }}>No micro-action for today.</span>
            <Link to="/weekly"><button>Create one</button></Link>
          </div>
        ) : (
          <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
            <div style={{ marginBottom: 4 }}>{todayAction.label}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {todayAction.completedAt ? `Completed at ${displayDateTime(todayAction.completedAt)}` : "Not completed yet"}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link to="/weekly"><button>Open timer</button></Link>
            </div>
          </div>
        )}
      </section>

      {/* Quick wins */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Recent wins</h2>
        {recentWins.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No wins captured yet.</div>
        ) : (
          <ul>
            {recentWins.map((w, i) => (
              <li key={`${w}-${i}`} style={{ marginTop: 6 }}>• {w}</li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8 }}>
          <Link to="/weekly"><button>Add wins / review</button></Link>
        </div>
      </section>
    </div>
  );
}

