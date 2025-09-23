// vitejs-vite-t1pxjefp/src/utils/date.ts

// ---------- ISO helpers (storage-friendly) ----------
export const todayISO = (d: Date = new Date()) => d.toISOString().slice(0, 10);

export function startOfWeekISO(d: Date = new Date()) {
  // 0=Sun .. 6=Sat ; force Monday as week start
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  return todayISO(start);
}

export function endOfWeekISO(d: Date = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return todayISO(end);
}

export function isoWeekId(d: Date = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const oneJan = new Date(start.getFullYear(), 0, 1);
  const diff = (start.valueOf() - oneJan.valueOf()) / 86400000;
  const week = Math.ceil((diff + oneJan.getDay() + 1) / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ---------- Display helpers ----------
export function displayDate(iso?: string) {
  // "YYYY-MM-DD" -> "DD/MM/YY"
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function displayDateTime(input?: string | Date) {
  // Date or ISO -> "DD/MM/YY HH:mm"
  if (!input) return "";
  const dt = typeof input === "string" ? new Date(input) : input;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(2);
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

export function displayDateLong(iso?: string) {
  // "YYYY-MM-DD" -> "Mon 22 Sep 25"
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()];
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()];
  return `${wd} ${String(dt.getDate()).padStart(2,"0")} ${mo} ${String(dt.getFullYear()).slice(2)}`;
}
