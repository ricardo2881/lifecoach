// weeklyReview.ts
// Generates a rich Obsidian-ready weekly review markdown file
// pulling from both habit logs (lifecoach-ricardo-v1) and notes (rvlifecoach_notes).

import type { Note, ReflectionNote, BrainDumpNote } from '../hooks/useNotes';

interface HabitLog {
  date: string;
  med?: boolean;
  str?: boolean;
  steps?: boolean;
  fun?: boolean;
  stress?: number;
}

interface AppState {
  habitLogs: HabitLog[];
}

function loadHabitLogs(): HabitLog[] {
  try {
    const raw = localStorage.getItem('lifecoach-ricardo-v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppState;
    return Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [];
  } catch { return []; }
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem('rvlifecoach_notes');
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch { return []; }
}

function getWeekDates(weekOffset = 0): { start: string; end: string; dates: string[] } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun
  const daysToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday - weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return { start: dates[0], end: dates[6], dates };
}

function pct(count: number, goal: number): string {
  return `${Math.round((count / goal) * 100)}%`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
}

function moodLabel(n: number): string {
  return ['', 'Low', 'Below avg', 'OK', 'Good', 'Great'][Math.round(n)] ?? 'OK';
}

export function generateWeeklyReview(weekOffset = 0): string {
  const { start, end, dates } = getWeekDates(weekOffset);
  const habitLogs = loadHabitLogs();
  const notes = loadNotes();

  // Filter to this week
  const weekHabits = habitLogs.filter(h => dates.includes(h.date));
  const weekNotes = notes.filter(n => dates.includes(n.date));
  const reflections = weekNotes.filter((n): n is ReflectionNote => n.type === 'reflection');
  const brainDumps = weekNotes.filter((n): n is BrainDumpNote => n.type === 'brain-dump');

  // Habit counts
  const medDays = weekHabits.filter(h => h.med).length;
  const strDays = weekHabits.filter(h => h.str).length;
  const stepsDays = weekHabits.filter(h => h.steps).length;
  const funDays = weekHabits.filter(h => h.fun).length;
  const stressValues = weekHabits.filter(h => typeof h.stress === 'number').map(h => h.stress as number);
  const avgStress = avg(stressValues);

  // Reflection averages
  const moodValues = reflections.map(r => r.mood);
  const energyValues = reflections.map(r => r.energy);
  const avgMood = avg(moodValues);
  const avgEnergy = avg(energyValues);

  // Collect wins and gratitude
  const wins = reflections.filter(r => r.biggestWin?.trim()).map(r => `- ${r.biggestWin.trim()}`);
  const gratitudes = reflections.filter(r => r.gratitude?.trim()).map(r => `- ${r.gratitude.trim()}`);

  // Build frontmatter
  const lines: string[] = [
    '---',
    `date: ${start}`,
    `week_end: ${end}`,
    `tags: [weekly-review, life-optimization]`,
    avgMood ? `avg_mood: ${avgMood}` : '',
    avgEnergy ? `avg_energy: ${avgEnergy}` : '',
    avgStress ? `avg_stress: ${avgStress}` : '',
    '---',
    '',
    `# 📅 Weekly Review — ${start} to ${end}`,
    '',
    '## 🏋️ Habit Scorecard',
    '',
    `| Habit | Days | Goal | Score |`,
    `|-------|------|------|-------|`,
    `| 🧘 Meditation | ${medDays}/7 | 7 | ${pct(medDays, 7)} |`,
    `| 💪 Strength | ${strDays}/7 | 2 | ${pct(strDays, 2)} |`,
    `| 👟 10k Steps | ${stepsDays}/7 | 4 | ${pct(stepsDays, 4)} |`,
    `| 👨‍👩‍👧 Family Fun | ${funDays}/7 | 4 | ${pct(funDays, 4)} |`,
    '',
  ];

  if (stressValues.length) {
    lines.push(
      '## 😤 Stress & Wellbeing',
      '',
      `- **Average stress:** ${avgStress}/10`,
      `- **Readings logged:** ${stressValues.length}/7 days`,
      stressValues.length ? `- **Range:** ${Math.min(...stressValues)} – ${Math.max(...stressValues)}` : '',
      '',
    );
  }

  if (moodValues.length || energyValues.length) {
    lines.push(
      '## 🌡️ Mood & Energy',
      '',
      avgMood ? `- **Average mood:** ${avgMood}/5 (${moodLabel(avgMood)})` : '',
      avgEnergy ? `- **Average energy:** ${avgEnergy}/5 (${moodLabel(avgEnergy)})` : '',
      `- **Reflections logged:** ${reflections.length}/7 days`,
      '',
    );
  }

  if (wins.length) {
    lines.push('## 🏆 Wins This Week', '', ...wins, '');
  }

  if (gratitudes.length) {
    lines.push('## 🙏 Gratitude', '', ...gratitudes, '');
  }

  if (brainDumps.length) {
    lines.push('## 🧠 Brain Dumps', '');
    brainDumps.forEach(n => {
      const time = new Date(n.timestamp).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      lines.push(`- **${time}** — ${n.content.trim()}`);
    });
    lines.push('');
  }

  lines.push(
    '## 📝 Reflection Prompts',
    '',
    '> What was the highlight of this week?',
    '',
    '> What drained my energy most?',
    '',
    '> What\'s one thing I\'ll do differently next week?',
    '',
    '> What am I most proud of?',
    '',
    '---',
    `*Generated by Ricardo Life Optimization App — ${new Date().toLocaleString()}*`,
  );

  return lines.filter(l => l !== undefined).join('\n');
}

export function downloadWeeklyReview(weekOffset = 0): void {
  const { start } = getWeekDates(weekOffset);
  const markdown = generateWeeklyReview(weekOffset);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `weekly-review-${start}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
