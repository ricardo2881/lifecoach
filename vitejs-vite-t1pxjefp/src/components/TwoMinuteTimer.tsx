import { useEffect, useRef, useState } from 'react';

export default function TwoMinuteTimer({
  seconds = 120,
  onComplete
}: { seconds?: number; onComplete?: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      tick.current = window.setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(tick.current!); onComplete?.(); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running, onComplete]);

  return (
    <div className="p-4 rounded-xl border flex items-center justify-between">
      <div className="text-3xl tabular-nums">{format(remaining)}</div>
      <div className="flex gap-2">
        {!running && <button className="border rounded-xl px-3 py-2" onClick={() => setRunning(true)}>Start</button>}
        {running && <button className="border rounded-xl px-3 py-2" onClick={() => setRunning(false)}>Pause</button>}
        <button className="border rounded-xl px-3 py-2" onClick={() => { setRunning(false); setRemaining(seconds); }}>Reset</button>
      </div>
    </div>
  );
}
function format(s: number) {
  const m = Math.floor(s/60), ss = s%60;
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

