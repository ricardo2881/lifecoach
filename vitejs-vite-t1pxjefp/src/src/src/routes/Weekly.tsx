import { useEffect, useState } from 'react';
import { db, Week, Outcome, MicroAction } from '../data/store';
import { isoWeekId, startOfWeekISO, endOfWeekISO, todayISO } from '../utils/date';

export default function Weekly() {
  const [week, setWeek] = useState<Week | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [todayAction, setTodayAction] = useState<MicroAction | null>(null);

  useEffect(() => {
    (async () => {
      const id = isoWeekId(new Date());
      let w = await db.weeks.get(id);
      if (!w) {
        w = { id, startsAt: startOfWeekISO(new Date()), endsAt: endOfWeekISO(new Date()) };
        await db.weeks.put(w);
      }
      setWeek(w);
      const outs = await db.outcomes.where('weekId').equals(w.id).toArray();
      setOutcomes(outs);
      const actions = await db.actions.where('date').equals(todayISO()).toArray();
      setTodayAction(actions[0] ?? null);
    })();
  }, []);

  async function addOutcome(title: string) {
    if (!week) return;
    const o: Outcome = {
      id: crypto.randomUUID(),
      weekId: week.id,
      title,
      status: 'planned'
    };
    await db.outcomes.put(o);
    setOutcomes(await db.outcomes.where('weekId').equals(week.id).toArray());
  }

  return (
    <div className="p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Weekly Focus</h1>
        <p className="text-sm opacity-70">{week?.startsAt} to {week?.endsAt}</p>
      </header>

      <PlanSection outcomes={outcomes} onAdd={addOutcome} />

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Do (today)</h2>
        {todayAction
          ? <ActionCard action={todayAction} />
          : <p className="text-sm opacity-70">No micro-action scheduled for today yet.</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Review (Friday)</h2>
        <p className="text-sm opacity-70">Capture wins, trends, and set next week’s outcomes.</p>
      </section>
    </div>
  );
}

function PlanSection({ outcomes, onAdd }: { outcomes: Outcome[]; onAdd: (t: string)=>void }) {
  const [title, setTitle] = useState('');
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Plan (pick 1–3 outcomes)</h2>
      <ul className="space-y-1">
        {outcomes.map(o => (
          <li key={o.id} className="p-3 rounded-xl border flex items-center justify-between">
            <span>{o.title}</span>
            <span className="text-xs opacity-60">{o.status}</span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="border rounded-xl px-3 py-2 flex-1"
               value={title} placeholder="Outcome (max 3)"
               onChange={e=>setTitle(e.target.value)} />
        <button className="px-3 py-2 rounded-xl border"
                onClick={() => { if (title.trim()) { onAdd(title.trim()); setTitle(''); }}}>
          Add
        </button>
      </div>
    </section>
  );
}

function ActionCard({ action }: { action: MicroAction }) {
  return (
    <div className="p-3 rounded-xl border">
      <div className="text-sm opacity-70">{action.date}</div>
      <div className="text-base">{action.label}</div>
      <button className="mt-2 px-3 py-2 rounded-xl border">Start 2-min</button>
    </div>
  );
}

