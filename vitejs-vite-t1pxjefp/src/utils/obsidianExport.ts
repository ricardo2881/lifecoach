import type { Note, BrainDumpNote, ReflectionNote } from '../hooks/useNotes';

function moodLabel(score: number): string {
  const labels: Record<number, string> = { 1: 'Low', 2: 'Below Average', 3: 'OK', 4: 'Good', 5: 'Great' };
  return labels[score] ?? String(score);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildMarkdown(date: string, notes: Note[]): string {
  const reflection = notes.find((n): n is ReflectionNote => n.type === 'reflection');
  const brainDumps = notes.filter((n): n is BrainDumpNote => n.type === 'brain-dump');

  const frontmatter = [
    '---',
    `date: ${date}`,
    `tags: [daily-note, life-optimization]`,
    reflection ? `mood: ${reflection.mood}` : '',
    reflection ? `energy: ${reflection.energy}` : '',
    '---',
  ].filter(Boolean).join('\n');

  const sections: string[] = [frontmatter, '', `# Daily Note — ${date}`, ''];

  if (reflection) {
    sections.push('## 🌅 Daily Reflection', '');
    if (reflection.biggestWin) sections.push(`### Biggest Win`, reflection.biggestWin.trim(), '');
    if (reflection.gratitude) sections.push(`### Gratitude`, reflection.gratitude.trim(), '');
    if (reflection.onMind) sections.push(`### On My Mind`, reflection.onMind.trim(), '');
    sections.push(
      `### Scores`,
      `- Mood: ${reflection.mood}/5 (${moodLabel(reflection.mood)})`,
      `- Energy: ${reflection.energy}/5 (${moodLabel(reflection.energy)})`,
      ''
    );
  }

  if (brainDumps.length > 0) {
    sections.push('## 🧠 Brain Dumps', '');
    brainDumps.forEach((n) => {
      sections.push(`- **${formatTime(n.timestamp)}** — ${n.content.trim()}`);
    });
    sections.push('');
  }

  return sections.join('\n');
}

export function exportToObsidian(date: string, notes: Note[]): void {
  const notesForDate = notes.filter((n) => n.date === date);
  if (notesForDate.length === 0) {
    alert('No notes for this date to export.');
    return;
  }
  const markdown = buildMarkdown(date, notesForDate);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
