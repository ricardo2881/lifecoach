// vitejs-vite-t1pxjefp/src/utils/date.ts

// ISO (YYYY-MM-DD) for storage/sorting
export const todayISO = (d: Date = new Date()) => d.toISOString().slice(0, 10);

// Monday (start of week) as YYYY-MM-DD
export function startOfWeekISO(d: Date = new Date()) {
  const day = d.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // back to Monday
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  return todayISO(start);
}

// Sunday (end of week) as YYYY-MM-DD
export function endOfWeekISO(d: Date = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return todayISO(end);
}

// Unique id like "2025-W35"
export function isoWeekId(d: Date = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const oneJan = new Date(start.getFullYear(), 0, 1);
  const diff = (start.valueOf() - oneJan.valueOf()) / 86400000;
  const week = Math.ceil((diff + oneJan.getDay() + 1) / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Display helpers

// "YYYY-MM-DD" → "DD/MM/YY"
export function displayDate(iso?: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

// Date or ISO string → "DD/MM/YY HH:mm"
export function displayDateTime(input?: string | Date) {
  if (!input) return "";
  const dt = typeof input === "string" ? new Date(input) : input;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = String(dt.getFullYear()).slice(2);
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}
