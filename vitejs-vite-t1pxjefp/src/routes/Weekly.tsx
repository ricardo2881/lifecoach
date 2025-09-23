// vitejs-vite-t1pxjefp/src/routes/Weekly.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, Week, Outcome as OType, MicroAction as AType } from "../data/store";
import {
  isoWeekId,
  startOfWeekISO,
  endOfWeekISO,
  todayISO,
  displayDate,
  displayDateTime,
  displayDateLong,
} from "../utils/date";

type Outcome = OType;
type MicroAction = AType;

export default function Weekly() {
  // ---- state ----
  const [week, setWeek] = useState<Week | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);
  const [remaining, setRemaining] = useState<number>(120);
  const [running, setRunning] = useState<boolean>(false);

  // Review: notes + wins + save status
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [wins, setWins] = useState<string[]>([]);
  const [winInput, setWinInput] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // For debounced auto-save
  const saveTimer = useRef<number | null>(null);

  // ---- load on mount ----
  useEffect(() => {
    (async () => {
      const id = isoWeekId(new Date());

      // ensure week record exists
      let w = await db.weeks.get(id);
      if (!w) {
        w = {
          id,
          startsAt: startOfWeekISO(new Date()),
          endsAt: endOfWeekISO(new Date()),
        };
        await db.weeks.put(w);
      }
      setWeek(w);

      // load outcomes
      const outs = await db.outcomes.where("weekId").equals(w.id).toArray();
      setOutcomes(outs);

      // load today's action (by date)
      const actions = await db.actions.where("date").equals(todayISO()).toArray();
      setTodayAction(actions[0] ?? null);

      // load review notes & wins
      const existingReview = await db.reviews.get(w.id);
      if (existingReview?.notes) setReviewNotes(existingReview.notes);
      if (existingReview?.wins?.length) setWins(existingReview.wins);
    })();
  }, []);

  // ---- actions ----
  async function addOutcome() {
    if (!week) return;
    if (!newOutcome.trim()) return;
    if (outcomes.length >= 3) {
      alert("Keep it to 1–3 outcomes.");
      return;
    }

    const o: Outcome = {
      id: crypto.randomUUID(),
      weekId: week.id,
      title: newOutcome.trim(),
      status: "planned",
    };
    await db.outcomes.put(o);
    setNewOutcome("");
    setOutcomes(await db.outcomes.where("weekId").equals(week.id).toArray());
  }

  async function createTodayAction() {
    if (!week) return;

    const outs = await db.outcomes.where("weekId").equals(week.id).toArray();
    const first = outs[0];
    if (!first) {
      alert("Add an outcome first.");
      return;
    }

    // Optionally mark first as "in_progress"
    if (first.status === "planned") {
      await db.outcomes.put({ ...first, status: "in_progress" });
      setOutcomes(await db.outcomes.where("weekId").equals(week.id).toArray());
    }

    const a: MicroAction = {
      id: crypto.randomUUID(),
      outcomeId: first.id,
      date: todayISO(),
      label: `2-min move on: ${first.title}`,
      durationSec: 120,
    };
    await db.actions.put(a);
    setTodayAction(a);
    setRemaining(120);
    setRunning(false);
  }

  // Quick wins handlers
  function addWin() {
    const text = winInput.trim();
    if (!text) return;
    setWins((prev) => [...prev, text]);
    setWinInput("");
    setSaveStatus("saving");
  }
  function removeWin(index: number) {
    setWins((prev) => prev.filter((_, i) => i !== index));
    setSaveStatus("saving");
  }

  // Auto-save review (notes + wins) — debounced ~800ms
  useEffect(() => {
    if (!week) return;

    setSaveStatus("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await db.reviews.put({
        id: week.id,
        weekId: week.id,
        notes: reviewNotes,
        wins,
        kpiSnapshot: {},
      });
      setSaveStatus("saved");
      saveTimer.current = null;
    }, 800);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [reviewNotes, wins, week]);

  // ---- timer effect ----
  useEffect(() => {
    if (!running) return;

    const t = setInterval(() => {
      setRemaining((r: number) => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          (async () => {
            if (todayAction) {
              todayAction.completedAt = new Date().toISOString();
              await db.actions.put(todayAction);
              setTodayAction({ ...todayAction });

              // Optional: mark outcome as done on first completion
              const oc = outcomes.find((o) => o.id === todayAction.outcomeId);
              if (oc && oc.status !== "done" && week) {
                await db.outcomes.put({ ...oc, status: "done" });
                setOutcomes(await db.outcomes.where("weekId").equals(week.id).toArray());
              }
            }
          })();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [running, todayAction, outcomes, week]);

  // ---- helpers ----
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0"); // <-- fixed here

  const disableAdd = useMemo(() => outcomes.length >= 3, [outcomes.length]);

  // ---- render ----
  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Weekly Focus</h1>
        <p style={{ opacity: 0.7, fontSize: 13 }}>
          {displayDateLong(week?.startsAt)}{" — "}{displayDateLong(week?.endsAt)}
        </p>
      </header>

      {/* PLAN */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 18 }}>Plan (pick 1–3 outcomes)</h2>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newOutcome}
            onChange={(e) => setNewOutcome(e.target.value)}
            placeholder="Outcome…"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={addOutcome} disabled={disableAdd}>Add</button>
        </div>

        <ul style={{ marginTop: 8 }}>
          {outcomes.map((o: Outcome) => (
            <li
              key={o.id}
              style={{
                padding: 8,
                border: "1px solid #eee",
                borderRadius: 8,
                marginTop: 6,
                background: o.status === "done" ? "#f0fff0" : undefined,
              }}
            >
              {o.title}{" "}
              <span style={{ opacity: 0.6, fontSize: 12 }}>({o.status})</span>
            </li>
          ))}
        </ul>
      </section>

      {/* DO */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>Do (today)</h2>

        {!todayAction ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ opacity: 0.7, fontSize: 14 }}>
              No micro-action for today.
            </span>
            <button onClick={createTodayAction}>Create one</button>
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
            }}
          >
            <div style={{ marginBottom: 6 }}>{todayAction.label}</div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 20,
                marginBottom: 8,
              }}
            >
              {mm}:{ss}
            </div>

            {!running && !todayAction.completedAt && remaining > 0 && (
              <button onClick={() => setRunning(true)}>Start 2-min</button>
            )}

            {running && (
              <button onClick={() => setRunning(false)}>Pause</button>
            )}

            {todayAction.completedAt && (
              <div style={{ color: "green", marginTop: 6 }}>
                Logged at {displayDateTime(todayAction.completedAt)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* REVIEW */}
      <section style={{ marginTop: 24, marginBottom: 64 }}>
        <h2 style={{ fontSize: 18 }}>Review (Friday)</h2>
        <p style={{ opacity: 0.7, fontSize: 14, marginBottom: 8 }}>
          Capture wins and set next week’s outcomes.
        </p>

        {/* Notes (auto-saved) */}
        <textarea
          value={reviewNotes}
          onChange={(e) => {
            setSaveStatus("saving");
            setReviewNotes(e.target.value);
          }}
          placeholder="What went well? What will you improve? Next week's focus?"
          style={{ width: "100%", minHeight: 120, padding: 8 }}
        />

        {/* Quick Wins */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Quick wins</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={winInput}
              onChange={(e) => setWinInput(e.target.value)}
              placeholder="Add a short win…"
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={addWin}>Add win</button>
          </div>

          {wins.length > 0 && (
            <ul style={{ marginTop: 8 }}>
              {wins.map((w, i) => (
                <li
                  key={`${w}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 8,
                    border: "1px solid #eee",
                    borderRadius: 8,
                    marginTop: 6,
                    background: "#fafafa",
                  }}
                >
                  <span>{w}</span>
                  <button onClick={() => removeWin(i)} aria-label={`Remove ${w}`}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
          {saveStatus === "saving" && "Saving…"}
          {saveStatus === "saved" && `Saved (${displayDate(todayISO())})`}
        </div>
      </section>
    </div>
  );
}
