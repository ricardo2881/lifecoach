import { useState } from 'react';

const templates = {
  lite: `Act as a helpful co-pilot.
Context: {{context}}
Task: {{task}}
Constraints: concise, actionable, next steps.`,
  full: `Act as a professional App developer/designer
Context: {{context}}
Goals: {{goals}}
Deliverable: {{deliverable}}
Audience: {{audience}}
Tone: sharp, professional, clear
Process: Outline -> Draft -> Refine -> Final
Output: directly usable, bulletproof steps`
};

export default function PromptComposer({ contextVars }: { contextVars: Record<string,string> }) {
  const [mode, setMode] = useState<'lite'|'full'>('lite');
  const [task, setTask] = useState('');
  const tpl = templates[mode];

  function render(str: string) {
    return str
      .replace('{{context}}', contextVars.context ?? '')
      .replace('{{goals}}', contextVars.goals ?? '')
      .replace('{{deliverable}}', contextVars.deliverable ?? '')
      .replace('{{audience}}', contextVars.audience ?? '')
      .replace('{{task}}', task);
  }
  const output = render(tpl);

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md p-4 rounded-2xl border bg-white shadow">
      <div className="flex items-center justify-between mb-2">
        <strong>Prompt Composer</strong>
        <select className="border rounded px-2 py-1" value={mode} onChange={e=>setMode(e.target.value as any)}>
          <option value="lite">Lite</option>
          <option value="full">Full</option>
        </select>
      </div>
      <textarea className="w-full border rounded-xl p-2 h-28"
                placeholder="Describe the task..." value={task}
                onChange={e=>setTask(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="border rounded-xl px-3 py-2" onClick={() => navigator.clipboard.writeText(output)}>Copy</button>
        <button className="border rounded-xl px-3 py-2" onClick={() => downloadTxt('prompt.txt', output)}>Save .txt</button>
      </div>
    </div>
  );
}
function downloadTxt(name: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

