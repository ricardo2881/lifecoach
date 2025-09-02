import { useState, useMemo } from 'react';
import PromptComposer from './PromptComposer';

type Vars = Record<string, string>;

export default function FloatingComposer(props: {
  contextVars?: Vars;
  buildVars?: () => Vars; // optional builder fn if vars come from page state
  label?: string;         // button label
}) {
  const [open, setOpen] = useState(false);
  const vars = useMemo(() => {
    if (props.buildVars) return props.buildVars();
    return props.contextVars ?? {};
  }, [props]);

  return (
    <>
      {open && <PromptComposer contextVars={vars} />}

      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open Prompt Composer"
        className="fixed bottom-20 right-4 px-4 py-3 rounded-2xl border shadow bg-white"
        style={{ zIndex: 50 }}
      >
        {props.label ?? (open ? 'Close Composer' : 'Compose')}
      </button>
    </>
  );
}

