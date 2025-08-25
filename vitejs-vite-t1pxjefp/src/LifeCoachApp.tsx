import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { Moon, Sun, Play, Square, Check } from "lucide-react";

type HabitKey = "med" | "str" | "steps" | "fun";
type Mode = "auto" | "day" | "night";

type HabitLog = {
  date: string; // YYYY-MM-DD
  med?: boolean;
  str?: boolean;
  steps?: boolean;
  fun?: boolean;
  stress?: number; // 0..10
};

type WindDownLog = {
  ts: number;
  checklist: { devicesOff: boolean; tidyUp: boolean; planTomorrow: boolean };
  note?: string;
};

type AppState = {
  windDownTime: string; // "HH:MM"
  mode: Mode;
  logs: WindDownLog[];
  habitLogs: HabitLog[];
  lastChimeDate?: string; // YYYY-MM-DD
};

const STORAGE_KEY = "lifecoach-ricardo-v1";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return {
        windDownTime: parsed.windDownTime || "20:30",
        mode: parsed.mode || "auto",
        logs: Array.isArray(parsed.logs) ? parsed.logs.slice(-100) : [],
        habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
        lastChimeDate: parsed.lastChimeDate
      };
    }
  } catch {}
  return {
    windDownTime: "20:30",
    mode: "auto",
    logs: [],
    habitLogs: [],
    lastChimeDate: undefined
  };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayStr(d = new Date()) {
  const tz = new Date(d);
  const y = tz.getFullYear();
  const m = String(tz.getMonth() + 1).padStart(2, "0");
  const day = String(tz.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseTimeToMinutes(t: string) {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function isAfterWindDown(now: Date, windDownTime: string) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const wd = parseTimeToMinutes(windDownTime);
  // Night window: from windDownTime to 05:00 next day
  if (nowMins >= wd) return true;
  if (nowMins <= 5 * 60) return true;
  return false;
}

function useNowTick(ms: number) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function gentleChimeAndVibrate() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 523.25;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.2, now + 0.02);
      g.gain.linearRampToValueAtTime(0.0, now + 1.2);
      o.start(now);
      o.stop(now + 1.25);
    }
  } catch {}
  if (navigator.vibrate) {
    try {
      navigator.vibrate([150, 60, 150]);
    } catch {}
  }
}

function getOrCreateHabitForDate(state: AppState, date: string) {
  const found = state.habitLogs.find((h) => h.date === date);
  if (found) return found;
  const obj: HabitLog = { date };
  state.habitLogs.push(obj);
  return obj;
}

function streakCount(state: AppState, key: HabitKey): number {
  let count = 0;
  const start = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const ds = todayStr(d);
    const h = state.habitLogs.find((x) => x.date === ds);
    if (h && (h as any)[key]) count++;
    else break;
  }
  return count;
}

function weekStart(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun ... 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatShort(d: Date) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function Ring(props: { label: string; value: number; goal: number; color: string; sub?: string }) {
  const size = 110;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, props.value / props.goal));
  const dash = c * pct;
  const gap = c - dash;
  return (
    <div style={{ width: size, textAlign: "center" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={props.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${gap}` }}
          transition={{ duration: 0.8 }}
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: "#0f172a" }}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{props.label}</div>
      <div style={{ fontSize: 12, color: "#475569" }}>{props.sub || `${Math.round(props.value)} / ${props.goal}`}</div>
    </div>
  );
}

export default function LifeCoachApp() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [windDownOpen, setWindDownOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(120);
  const now = useNowTick(1000);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTimerLeft((s) => {
        if (!timerRunning) return s;
        if (s <= 1) {
          gentleChimeAndVibrate();
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  useEffect(() => {
    const isNight = state.mode === "night" || (state.mode === "auto" && isAfterWindDown(now, state.windDownTime));
    document.body.style.background = isNight ? "#0b1220" : "#f5f7fb";
    document.body.style.color = isNight ? "#e5e7eb" : "#0f172a";
  }, [state.mode, state.windDownTime, now]);

  useEffect(() => {
    const t = Date.now();
    if (t - lastSavedRef.current > 250) {
      saveState(state);
      lastSavedRef.current = t;
    }
  }, [state]);

  useEffect(() => {
    const today = todayStr(now);
    if (state.mode === "auto" && isAfterWindDown(now, state.windDownTime) && state.lastChimeDate !== today) {
      gentleChimeAndVibrate();
      setWindDownOpen(true);
      setState((s) => ({ ...s, lastChimeDate: today }));
    }
  }, [now, state.mode, state.windDownTime, state.lastChimeDate]);

  const todayHabit = useMemo(() => {
    const clone = JSON.parse(JSON.stringify(state)) as AppState;
    const h = getOrCreateHabitForDate(clone, todayStr());
    return { clone, h };
  }, [state]);

  function toggleHabit(key: HabitKey) {
    const { clone, h } = todayHabit;
    (h as any)[key] = !(h as any)[key];
    setState(clone);
  }

  function setStress(v: number) {
    const { clone, h } = todayHabit;
    h.stress = v;
    setState(clone);
  }

  function weekRangeData(weeks: number) {
    const out: { label: string; start: Date; end: Date }[] = [];
    const startThisWeek = weekStart(now);
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(startThisWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      out.push({ label: `${formatShort(start)}-${formatShort(end)}`, start, end });
    }
    return out;
  }

  function within(dStr: string, start: Date, end: Date) {
    const d = new Date(dStr + "T00:00:00");
    return d >= start && d <= end;
  }

  const ringStats = useMemo(() => {
    const last7 = new Date();
    last7.setDate(last7.getDate() - 6);
    let med = 0, str = 0, steps = 0, fun = 0;
    const stressVals: number[] = [];
    state.habitLogs.forEach((h) => {
      if (within(h.date, last7, now)) {
        if (h.med) med += 1;
        if (h.str) str += 1;
        if (h.steps) steps += 1;
        if (h.fun) fun += 1;
        if (typeof h.stress === "number") stressVals.push(h.stress);
      }
    });
    const avgStress = stressVals.length ? stressVals.reduce((a, b) => a + b, 0) / stressVals.length : 5;
    const stressInverse = Math.max(0, 10 - avgStress);
    return { med, str, steps, fun, stressInverse, avgStress };
  }, [state.habitLogs, now]);

  const weeksData = useMemo(() => {
    const ranges = weekRangeData(8);
    return ranges.map((r) => {
      let med = 0, steps = 0, str = 0, stressCount = 0, stressSum = 0;
      state.habitLogs.forEach((h) => {
        if (within(h.date, r.start, r.end)) {
          if (h.med) med += 1;
          if (h.steps) steps += 1;
          if (h.str) str += 1;
          if (typeof h.stress === "number") {
            stressSum += h.stress;
            stressCount += 1;
          }
        }
      });
      return {
        week: r.label,
        med,
        steps,
        str,
        stress: stressCount ? parseFloat((stressSum / stressCount).toFixed(2)) : null
      };
    });
  }, [state.habitLogs, now]);

  const isNight = state.mode === "night" || (state.mode === "auto" && isAfterWindDown(now, state.windDownTime));

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: isNight ? "#0f172a" : "#ffffff"
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: isNight ? "#cbd5e1" : "#475569" }}>
            Daily reflection
          </div>
          <div style={{ fontWeight: 700, maxWidth: 800 }}>
            Did I meditate, do morning strength, hit 10k steps, log family/solo fun, and set my stress for today? If not, do the smallest next action (2-minute version): 5 breaths, 10 bodyweight reps, or a short walk.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() =>
              setState((s) => ({
                ...s,
                mode: s.mode === "auto" ? "day" : s.mode === "day" ? "night" : "auto"
              }))
            }
            title="Toggle day/night/auto"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: isNight ? "#0b1220" : "#f8fafc",
              color: isNight ? "#e2e8f0" : "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer"
            }}
          >
            {isNight ? <Moon size={16} /> : <Sun size={16} />}
            <span style={{ fontSize: 12 }}>Mode: {state.mode}</span>
          </button>
          <button
            onClick={() => {
              setTimerLeft(120);
              setTimerRunning(false);
              setWindDownOpen(true);
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#eef2ff",
              color: "#1e293b",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer"
            }}
          >
            <Play size={16} />
            Wind-down
          </button>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: isNight ? "#0f172a" : "#ffffff" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick log for today</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <QuickToggle
              label="Meditation"
              active={!!todayHabit.h.med}
              onToggle={() => toggleHabit("med")}
            />
            <QuickToggle
              label="Strength"
              active={!!todayHabit.h.str}
              onToggle={() => toggleHabit("str")}
            />
            <QuickToggle
              label="10k Steps"
              active={!!todayHabit.h.steps}
              onToggle={() => toggleHabit("steps")}
            />
            <QuickToggle
              label="Family Fun"
              active={!!todayHabit.h.fun}
              onToggle={() => toggleHabit("fun")}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: isNight ? "#cbd5e1" : "#475569" }}>Stress for today</div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={todayHabit.h.stress ?? 5}
              onChange={(e) => setStress(parseInt(e.target.value, 10))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 12 }}>Value: {todayHabit.h.stress ?? 5} / 10</div>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: isNight ? "#0f172a" : "#ffffff" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Streaks</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Streak label="Meditation" days={streakCount(state, "med")} />
            <Streak label="Strength" days={streakCount(state, "str")} />
            <Streak label="10k Steps" days={streakCount(state, "steps")} />
            <Streak label="Family Fun" days={streakCount(state, "fun")} />
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: isNight ? "#0f172a" : "#ffffff"
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 12 }}>KPI rings (7-day window)</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Ring label="Meditation" value={ringStats.med} goal={7} color="#60a5fa" />
          <Ring label="Strength" value={ringStats.str} goal={2} color="#34d399" />
          <Ring label="10k Steps" value={ringStats.steps} goal={4} color="#fbbf24" />
          <Ring label="Family Fun" value={ringStats.fun} goal={4} color="#f472b6" />
          <Ring
            label="Stress inverse"
            value={ringStats.stressInverse}
            goal={10}
            color="#a78bfa"
            sub={`avg ${ringStats.avgStress.toFixed(1)} of 10`}
          />
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12
        }}
      >
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: isNight ? "#0f172a" : "#ffffff" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Stress vs Weeks</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={weeksData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="stress" name="Avg Stress" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, background: isNight ? "#0f172a" : "#ffffff" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Habits closed per week</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={weeksData}>
                <CartesianGrid stroke="#e5e7eb" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="med" name="Meditation" />
                <Area type="monotone" dataKey="steps" name="10k Steps" />
                <Area type="monotone" dataKey="str" name="Strength" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: isNight ? "#0f172a" : "#ffffff"
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700 }}>Evening wind-down</div>
          <div>
            <label style={{ fontSize: 12, marginRight: 8, color: isNight ? "#cbd5e1" : "#475569" }}>Time</label>
            <input
              type="time"
              value={state.windDownTime}
              onChange={(e) => setState((s) => ({ ...s, windDownTime: e.target.value }))}
              style={{ padding: 6, borderRadius: 8, border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: isNight ? "#cbd5e1" : "#475569", marginTop: 6 }}>
          App will auto-switch to night mode around wind-down time. A gentle chime and vibration will remind you once per day.
        </div>
      </div>

      <AnimatePresence>
        {windDownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 40
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 560,
                background: isNight ? "#0f172a" : "#ffffff",
                color: isNight ? "#e5e7eb" : "#0f172a",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Wind-down (2 minutes)</div>
                <button
                  onClick={() => setWindDownOpen(false)}
                  style={{ border: "1px solid #cbd5e1", background: "transparent", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
              <div style={{ height: 8 }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, minWidth: 100, textAlign: "center" }}>
                  {String(Math.floor(timerLeft / 60)).padStart(2, "0")}:{String(timerLeft % 60).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {!timerRunning ? (
                    <button
                      onClick={() => setTimerRunning(true)}
                      style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#eef2ff", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Play size={16} /> Start
                    </button>
                  ) : (
                    <button
                      onClick={() => setTimerRunning(false)}
                      style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fee2e2", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Square size={16} /> Pause
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerLeft(120);
                    }}
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <Checklist onSave={(log) => {
                setState((s) => {
                  const logs = [...s.logs, log].slice(-100);
                  return { ...s, logs };
                });
                setWindDownOpen(false);
              }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ height: 12 }} />

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: isNight ? "#0f172a" : "#ffffff"
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Recent wind-down logs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 8 }}>
          {state.logs.slice().reverse().slice(0, 8).map((l, idx) => (
            <div key={idx} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 12, color: "#475569" }}>{new Date(l.ts).toLocaleString()}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <Badge ok={l.checklist.devicesOff} text="Devices off" />
                <Badge ok={l.checklist.tidyUp} text="Tidy up" />
                <Badge ok={l.checklist.planTomorrow} text="Plan tomorrow" />
              </div>
              {l.note ? <div style={{ marginTop: 6, fontSize: 13 }}>{l.note}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickToggle(props: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={props.onToggle}
      style={{
        padding: "8px 10px",
        borderRadius: 20,
        border: "1px solid " + (props.active ? "#34d399" : "#cbd5e1"),
        background: props.active ? "#ecfdf5" : "#ffffff",
        color: "#0f172a",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer"
      }}
    >
      {props.active ? <Check size={16} /> : null}
      {props.label}
    </button>
  );
}

function Streak(props: { label: string; days: number }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 12, color: "#475569" }}>{props.label}</div>
      <div style={{ fontWeight: 800, fontSize: 20 }}>{props.days} days</div>
    </div>
  );
}

function Badge(props: { ok: boolean; text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        borderRadius: 999,
        padding: "2px 8px",
        border: "1px solid " + (props.ok ? "#34d399" : "#94a3b8"),
        background: props.ok ? "#ecfdf5" : "#f1f5f9",
        color: "#0f172a"
      }}
    >
      {props.text}
    </span>
  );
}

function Checklist(props: { onSave: (log: WindDownLog) => void }) {
  const [devicesOff, setDevicesOff] = useState(false);
  const [tidyUp, setTidyUp] = useState(false);
  const [planTomorrow, setPlanTomorrow] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Quick checklist</div>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={devicesOff} onChange={(e) => setDevicesOff(e.target.checked)} />
        Devices off and away from bed
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={tidyUp} onChange={(e) => setTidyUp(e.target.checked)} />
        Tidy up and prep for morning
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={planTomorrow} onChange={(e) => setPlanTomorrow(e.target.checked)} />
        Plan tomorrow in 3 bullets
      </label>

      <div style={{ height: 8 }} />

      <div>
        <div style={{ fontSize: 12, color: "#475569" }}>Note</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Reflection or highlights..."
          style={{ width: "100%", borderRadius: 8, border: "1px solid #cbd5e1", padding: 8 }}
        />
      </div>

      <div style={{ height: 10 }} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={() =>
            props.onSave({
              ts: Date.now(),
              checklist: { devicesOff, tidyUp, planTomorrow },
              note: note.trim() ? note.trim() : undefined
            })
          }
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#34d399", color: "#0b1220", cursor: "pointer" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
