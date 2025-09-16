export function todayISO(d: Date = new Date()) { 
  return d.toISOString().slice(0,10); 
}

export function startOfWeekISO(d = new Date()) {
  const day = d.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const start = new Date(d); 
  start.setDate(d.getDate() + diff);
  return todayISO(start);
}

export function endOfWeekISO(d = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const end = new Date(start); 
  end.setDate(start.getDate() + 6);
  return todayISO(end);
}

export function isoWeekId(d = new Date()) {
  const start = new Date(startOfWeekISO(d));
  const oneJan = new Date(start.getFullYear(),0,1);
  const diff = (start.valueOf() - oneJan.valueOf()) / 86400000;
  const week = Math.ceil((diff + oneJan.getDay()+1) / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

