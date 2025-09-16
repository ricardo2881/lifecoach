import { Outcome } from '../data/store';

export function buildWeeklyContextVars(opts: {
  weekRange?: { start?: string; end?: string };
  outcomes?: Outcome[];
} = {}) {
  const titles = (opts.outcomes ?? []).map(o => `- ${o.title}`).join('\n');
  const context =
    `Weekly Focus Window: ${opts.weekRange?.start ?? ''} to ${opts.weekRange?.end ?? ''}\n` +
    `Active Outcomes:\n${titles || '- (none yet)'}`;

  return {
    context,
    goals: 'Maintain streaks, ship weekly outcomes, compound momentum.',
    deliverable: 'Concise plan, next actions, or review summary.',
    audience: 'Me (personal), future Ricardo, and collaborators when shared.'
  };
}

