// vitejs-vite-t1pxjefp/src/routes/Weekly.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, Week, Outcome as OType, MicroAction as AType } from "../data/store";
import {
  isoWeekId,
  startOfWeekISO,
  endOfWeekISO,
  todayISO,
  displayDateTime,
  displayDateLong,
} from "../utils/date";

type Outcome = OType;
type MicroAction = AType;

export default function Weekly() {
  // ---- state ----
  const [week, setWeek] = useState<Week | null>(null);

  // outcomes
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // action (timer) & history
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);
  const [todayList, setTodayList] = useState<MicroAction[]>([]);
  const [weekList, setWeekList] = useState<MicroAction[]>([]);
  const [remaining, setRemaining] = useState<number>(120);
  const [running, setRunning] = useState<boolean>(false);

  // review (unchanged for Sprint A – still auto-saves from previous step)
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [wins, setWins] = useState<string[]>([]);
  const [winInput, setWinInput] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
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

      await refreshOutcomes(w.id);
      await refreshActions(w);
      await loadReview(w.id);
    })();
  }, []);

  // helpers to refresh pieces
  async function refreshOutcomes(weekId: string) {
    const outs = await db.outcomes.where("weekId").equals(weekId).toArray();
    setOutcomes(outs);
  }

  async function refreshActions(w: Week | null) {
    if (!w) return;
    // today list
    const today = await db.actions.where("date").equals(todayISO()).toArray();
    setTodayList(today);
    setTodayAction(today.find(a => !a.completedAt) ?? today[0] ?? null);

    // week list: date between week start and end (inclusive)
    const weekly = await db.actions
      .where("date")
      .between(w.startsAt, w.endsAt, true, true)
      .toArray();
    setWeekList(weekly);
  }

  async function loadReview(weekId: string) {
    const r = await db.reviews.get(weekId);
    if (r?.notes) setReviewNotes(r.notes);
    if (r?.wins?.length) setWins(r.wins);
  }

  // ---- outcomes: add, inline edit, status cycle ----
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
    await refreshOutcomes(week.id);
  }

  function startEdit(o: Outcome) {
    setEditingOutcomeId(o.id);
    setEditingTitle(o.title);
  }

  async function saveEdit(o: Outcome) {
    if (!week) return;
    const next = editingTitle.trim();
    if (!next) {
      setEditingOutcomeId(null);
      return;
    }
    await db.outcomes.put({ ...o, title: next });
    setEditingOutcomeId(null);
    await refreshOutcomes(week.id);
  }

  async function cycleStatus(o: Outcome) {
    if (!week) return;
    const next: Outcome["status"] =
      o.status === "planned" ? "in_progress" : o.status === "in_progress" ? "done" : "planned";
    await db.outcomes.put({ ...o, status: next });
    await refreshOutcomes(week.id);
  }

  // ---- action: create & timer ----
  const createDisabled = !!todayList.find(a => !a.completedAt);

  async function createTodayAction() {
    if (!week) return;
    if (createDisabled) return;

    const outs = await db.outcomes.where("weekId").equals(week.id).toArray();
    const first = outs[0];
    if (!first) {
      alert("Add an outcome first.");
      return;
    }

    // mark "in_progress" if still planned
    if (first.status === "planned") {
      await db.outcomes.put({ ...first, status: "in_progress" });
      await refreshOutcomes(week.id);
    }

    const a: MicroAction = {
      id: crypto.randomUUID(),
      outcomeId: first.id,
      date: todayISO(),
      label: `2-min move on: ${first.title}`,
      durationSec: 120,
    };
    await db.actions.put(a);
    setRemaining(120);
    setRunning(false);
    await refreshActions(week);
  }

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

              // mark its outcome as done (lightweight rule)
              const oc = outcomes.find(o => o.id === todayAction.outcomeId);
              if (oc && oc.status !== "done" && week) {
                await db.outcomes.put({ ...oc, status: "done" });
                await refreshOutcomes(week.id);
              }
              await refreshActions(week);
            }
          })();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [running, todayAction, outcomes, week]);

  // ---- action history: quick complete toggle ----
  async function toggleActionComplete(a: MicroAction) {
    if (!week) return;
    const nowCompleted = !a.completedAt;
    const updated: MicroAction = {
      ...a,
      completedAt: nowCompleted ? new Date().toISOString() : undefined,
    };
    await db.actions.put(updated);

    // if completing, softly mark outcome done
    if (nowCompleted) {
      const oc = await db.outcomes.get(a.outcomeId);
      if (oc && oc.status !== "done") {
        await db.outcomes.put({ ...oc, status: "done" });
        await refreshOutcomes(week.id);
      }
    }
    await refreshActions(week);
  }

  // ---- review: autosave (unchanged logic from last step) ----
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

  // quick wins handlers
  function addWin() {
    const t = winInput.trim();
    if (!t) return;
    setWins(prev => [...prev, t]);
    setWinInput("");
    setSaveStatus("saving");
  }
  function removeWin(i: number) {
    setWins(prev => prev.filter((_, idx) => idx !== i));
    setSaveStatus("saving");
  }

  // ---- derived ----
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const doneCount = outcomes.filter(o => o.status === "done").length;
  const disableAddOutcome = outcomes.length >= 3;

  // ---- render ----
  return (
    <div style={{ padding: 16, maxWidth: 780, margin: "0 auto" }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Weekly Focus</h1>
        <p style={{ opacity: 0.7, fontSize: 13 }}>
          {displayDateLong(week?.startsAt)}{" — "}{displayDateLong(week?.endsAt)}
        </p>
      </header>

      {/* PLAN */}
      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Plan (pick 1–3 outcomes)</h2>
          <span style={{
            fontSize: 12, padding: "2px 8px", borderRadius: 999,
            background: "#f2f4f7"
          }}>
            {doneCount} of {outcomes.length} done
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newOutcome}
            onChange={e => setNewOutcome(e.target.value)}
            placeholder="Outcome…"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={addOutcome} disabled={disableAddOutcome}>Add</button>
        </div>

        <ul style={{ marginTop: 8 }}>
          {outcomes.map((o) => (
            <li
              key={o.id}
              style={{
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 10,
                marginTop: 8,
                background:
                  o.status === "done" ? "#f0fff0" :
                  o.status === "in_progress" ? "#f7fbff" : undefined,
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "space-between"
              }}
            >
              {/* left: title (inline edit) */}
              <div style={{ flex: 1 }}>
                {editingOutcomeId === o.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => saveEdit(o)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(o);
                      if (e.key === "Escape") setEditingOutcomeId(null);
                    }}
                    style={{ width: "100%", padding: 6 }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(o)}
                    title="Click to edit"
                    style={{ cursor: "text" }}
                  >
                    {o.title}
                  </div>
                )}
              </div>

              {/* right: status chip */}
              <button
                onClick={() => cycleStatus(o)}
                title="Click to change status"
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background:
                    o.status === "planned" ? "#fafafa" :
                    o.status === "in_progress" ? "#e6f2ff" : "#e8ffe8",
                  fontSize: 12,
                  minWidth: 110
                }}
              >
                {o.status === "planned" && "planned"}
                {o.status === "in_progress" && "in progress"}
                {o.status === "done" && "done ✅"}
              </button>
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
            <button onClick={createTodayAction} disabled={createDisabled}>
              Create one
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              marginBottom: 12
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

        {/* ACTION HISTORY */}
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Today</div>
            {todayList.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 14 }}>Nothing yet.</div>
            ) : (
              <ul>
                {todayList.map(a => (
                  <li key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={!!a.completedAt}
                      onChange={() => toggleActionComplete(a)}
                    />
                    <span style={{ textDecoration: a.completedAt ? "line-through" : "none" }}>
                      {a.label}
                    </span>
                    {a.completedAt && (
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        ({displayDateTime(a.completedAt)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>This week</div>
            {weekList.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 14 }}>Nothing yet.</div>
            ) : (
              <ul>
                {weekList.map(a => (
                  <li key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <input
                      type="checkbox"
                      checked={!!a.completedAt}
                      onChange={() => toggleActionComplete(a)}
                    />
                    <span style={{ textDecoration: a.completedAt ? "line-through" : "none" }}>
                      {a.label}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>
                      {a.completedAt ? `(${displayDateTime(a.completedAt)})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* REVIEW (unchanged from last step; still here for completeness) */}
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
          {saveStatus === "saved" && `Saved`}
        </div>
      </section>
    </div>
  );
}
