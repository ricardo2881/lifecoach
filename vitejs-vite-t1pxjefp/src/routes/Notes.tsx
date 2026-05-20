import { useState, useRef, useCallback } from 'react';
import { useNotes } from '../hooks/useNotes';
import { exportToObsidian } from '../utils/obsidianExport';

type Tab = 'dump' | 'reflect';

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      onResult(e.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [supported, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, start, stop, supported };
}

function MoodSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const emojis = ['😔', '😕', '😐', '🙂', '😄'];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{emojis[value - 1]}</span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
        <span>Low</span><span>Great</span>
      </div>
    </div>
  );
}

function NoteCard({ note, onDelete }: { note: ReturnType<typeof useNotes>['notes'][number]; onDelete: () => void }) {
  const time = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (note.type === 'brain-dump') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>🧠 {time}</span>
          <button onClick={onDelete} style={deleteBtnStyle}>✕</button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5 }}>{note.content}</p>
      </div>
    );
  }
  return (
    <div style={{ ...cardStyle, borderLeft: '3px solid #6366f1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>🌅 Reflection — {note.date}</span>
        <button onClick={onDelete} style={deleteBtnStyle}>✕</button>
      </div>
      <p style={{ margin: '8px 0 4px', fontSize: 14 }}><strong>Win:</strong> {note.biggestWin || '—'}</p>
      <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Mood:</strong> {note.mood}/5 · <strong>Energy:</strong> {note.energy}/5</p>
    </div>
  );
}

export default function Notes() {
  const { notes, addBrainDump, addReflection, deleteNote, todayDate } = useNotes();
  const [activeTab, setActiveTab] = useState<Tab>('dump');
  const [dumpText, setDumpText] = useState('');
  const [dumpSaved, setDumpSaved] = useState(false);
  const [biggestWin, setBiggestWin] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [onMind, setOnMind] = useState('');
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [reflectSaved, setReflectSaved] = useState(false);

  const dumpVoice = useVoiceInput((text) => setDumpText((prev) => prev ? `${prev} ${text}` : text));
  const mindVoice = useVoiceInput((text) => setOnMind((prev) => prev ? `${prev} ${text}` : text));

  const handleSaveDump = () => {
    if (!dumpText.trim()) return;
    addBrainDump(dumpText);
    setDumpText('');
    setDumpSaved(true);
    setTimeout(() => setDumpSaved(false), 2000);
  };

  const handleSaveReflection = () => {
    if (!biggestWin.trim() && !onMind.trim() && !gratitude.trim()) return;
    addReflection({ biggestWin, gratitude, onMind, mood, energy });
    setBiggestWin(''); setGratitude(''); setOnMind(''); setMood(3); setEnergy(3);
    setReflectSaved(true);
    setTimeout(() => setReflectSaved(false), 2000);
  };

  const todayNotes = notes.filter((n) => n.date === todayDate);

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📓 Notes</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>{todayDate}</p>
      </div>

      <div style={tabBarStyle}>
        <button style={activeTab === 'dump' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('dump')}>🧠 Brain Dump</button>
        <button style={activeTab === 'reflect' ? activeTabStyle : tabStyle} onClick={() => setActiveTab('reflect')}>🌅 Daily Reflection</button>
      </div>

      {activeTab === 'dump' && (
        <div style={panelStyle}>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 0 }}>Capture any thought before it disappears.</p>
          <textarea placeholder="What's on your mind right now..." value={dumpText} onChange={(e) => setDumpText(e.target.value)} style={textareaStyle} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {dumpVoice.supported && (
              <button onClick={dumpVoice.listening ? dumpVoice.stop : dumpVoice.start} style={dumpVoice.listening ? listeningBtnStyle : micBtnStyle}>
                {dumpVoice.listening ? '⏹ Stop' : '🎙 Speak'}
              </button>
            )}
            <button onClick={handleSaveDump} disabled={!dumpText.trim()} style={primaryBtnStyle}>
              {dumpSaved ? '✅ Saved!' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'reflect' && (
        <div style={panelStyle}>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 0 }}>Take 2 minutes to close the day with intention.</p>
          <label style={labelStyle}>🏆 Biggest win today</label>
          <textarea placeholder="What went well?" value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)} style={{ ...textareaStyle, minHeight: 64 }} />
          <label style={labelStyle}>🙏 Grateful for</label>
          <textarea placeholder="One thing you're grateful for..." value={gratitude} onChange={(e) => setGratitude(e.target.value)} style={{ ...textareaStyle, minHeight: 64 }} />
          <label style={labelStyle}>💭 On my mind</label>
          <div style={{ position: 'relative' }}>
            <textarea placeholder="Anything to park for tomorrow..." value={onMind} onChange={(e) => setOnMind(e.target.value)} style={{ ...textareaStyle, minHeight: 64 }} />
            {mindVoice.supported && (
              <button onClick={mindVoice.listening ? mindVoice.stop : mindVoice.start} style={{ ...micBtnStyle, position: 'absolute', bottom: 16, right: 8 }}>
                {mindVoice.listening ? '⏹' : '🎙'}
              </button>
            )}
          </div>
          <MoodSlider label="Mood" value={mood} onChange={setMood} />
          <MoodSlider label="Energy" value={energy} onChange={setEnergy} />
          <button onClick={handleSaveReflection} disabled={!biggestWin.trim() && !onMind.trim() && !gratitude.trim()} style={primaryBtnStyle}>
            {reflectSaved ? '✅ Saved!' : 'Save Reflection'}
          </button>
        </div>
      )}

      {todayNotes.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Today's Notes ({todayNotes.length})</h2>
            <button onClick={() => exportToObsidian(todayDate, notes)} style={exportBtnStyle}>⬇ Export to Obsidian</button>
          </div>
          {todayNotes.map((note) => <NoteCard key={note.id} note={note} onDelete={() => deleteNote(note.id)} />)}
        </div>
      )}

      {notes.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 }}>No notes yet — start with a brain dump above ☝️</p>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = { maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'system-ui, sans-serif', color: '#1f2937' };
const tabBarStyle: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 16 };
const tabStyle: React.CSSProperties = { flex: 1, padding: '10px 0', border: '1px solid #e5e7eb', borderRadius: 10, background: '#f9fafb', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6b7280' };
const activeTabStyle: React.CSSProperties = { ...tabStyle, background: '#6366f1', color: '#fff', border: '1px solid #6366f1' };
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 };
const textareaStyle: React.CSSProperties = { width: '100%', minHeight: 100, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 15, lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6, marginTop: 12 };
const primaryBtnStyle: React.CSSProperties = { width: '100%', padding: '12px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 };
const micBtnStyle: React.CSSProperties = { padding: '10px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, cursor: 'pointer' };
const listeningBtnStyle: React.CSSProperties = { ...micBtnStyle, background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' };
const exportBtnStyle: React.CSSProperties = { padding: '6px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#16a34a', cursor: 'pointer', fontWeight: 500 };
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', marginBottom: 10 };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 13, padding: 0 };
