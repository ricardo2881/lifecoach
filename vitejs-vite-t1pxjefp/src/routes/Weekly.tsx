import React, { useEffect, useState } from "react";
import { db, Week, Outcome as OType, MicroAction as AType } from "../data/store";
import { isoWeekId, startOfWeekISO, endOfWeekISO, todayISO } from "../utils/date";

type Outcome = OType;
type MicroAction = AType;

export default function Weekly() {
  const [week, setWeek] = useState<Week | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);
  const [remaining, setRemaining] = useState(120);
  const [running, setRunning] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");


  // Load/initialize current week, outcomes, and today's action
  useEffect(() => {
    (async () => {
      const id = isoWeekId(new Date());
      let w = await db.weeks.get(id);
      if (!w) {
        w = { id, startsAt: startOfWeekISO(new Date()), endsAt: endOfWeekISO(new Date()) };
        await db.weeks.put(w);
      }
      setWeek(w);
      // Load review notes for this week (if any)
const existingReview = await db.reviews.get(w.id);
if (existingReview?.notes) setReviewNotes(existingReview.notes);

      const actions = await db.actions.where("date").equals(todayISO()).toArray();
      setTodayAction(actions[0] ?? null);
    })();
  }, []);

  async function addOutcome() {
    if (!week) return;
    if (!newOutcome.trim()) return;
    if (outcomes.length >= 3) return alert("Keep it to 1–3 outcomes.");
    const o: Outcome = {
      id: crypto.randomUUID(),
      weekId: week.id,
      title: newOutcome.trim(),
      status: "planned"
    };
    await db.outcomes.put(o);
    setNewOutcome("");
    setOutcomes(await db.outcomes.where("weekId").equals(week.id).toArray());
  }

  async function createTodayAction() {
    if (!week) return;
    const first = (await db.outcomes.where("weekId").equals(week.id).toArray())[0];
    if (!first) return alert("Add an outcome first.");
    const a: MicroAction = {
      id: crypto.randomUUID(),
      outcomeId: first.id,
      date: todayISO(),
      label: `2-min move on: ${first.title}`,
      durationSec: 120
    };
    await db.actions.put(a);
    setTodayAction(a);
    setRemaining(120);
    setRunning(false);
  }
async function saveReview() {
  if (!week) return;
  await db.reviews.put({
    id: week.id,       // use the week id as review id
    weekId: week.id,
    notes: reviewNotes,
    wins: [],          // you can fill this later
    kpiSnapshot: {}    // optional metrics later
  });
  alert("Review saved.");
}

  // Timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          (async () => {
            if (todayAction) {
              todayAction.completedAt = new Date().toISOString();
              await db.actions.put(todayAction);
              setTodayAction({ ...todayAction });
            }
          })();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, todayAction]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Weekly Focus</h1>
        <p style={{ opacity: .7, fontSize: 13 }}>{week?.startsAt} – {week?.endsAt}</p>
      </header>

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
            {!running && !todayAction.completedAt && remaining > 0 && (
              <button onClick={() => setRunning(true)}>Start 2-min</button>
            )}
            {running && <button onClick={() => setRunning(false)}>Pause</button>}
            {todayAction.completedAt && (
              <div style={{ color: "green", marginTop: 6 }}>
                Logged at {new Date(todayAction.completedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
  <h2 style={{ fontSize: 18 }}>Review (Friday)</h2>

  <p style={{ opacity: .7, fontSize: 14, marginBottom: 8 }}>
    Capture wins and set next week’s outcomes.
  </p>

  <textarea
    value={reviewNotes}
    onChange={(e) => setReviewNotes(e.target.value)}
    placeholder="What went well? What will you improve? Next week's focus?"
    style={{ width: "100%", minHeight: 120, padding: 8 }}
  />

  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
    <button onClick={saveReview}>Save review</button>
    <span style={{ fontSize: 12, opacity: 0.6 }}>
      Saved per week ({week?.startsAt}–{week?.endsAt})
    </span>
  </div>
</section>
  );
}
