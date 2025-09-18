// Get today's date in YYYY-MM-DD
export const todayISO = (d: Date = new Date()) => d.toISOString().slice(0, 10);

// Monday (start of week) in YYYY-MM-DD
export function startOfWeekISO(d: Date = new Date()) {
  const day = d.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  return todayISO(start);
}

// Sunday (end of week) in YYYY-MM-DD
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
