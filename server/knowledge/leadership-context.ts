import type { OfficeEntry } from '../scheduling/scheduled-work';
import { knowledgeEntries } from './office-state-view';
import { collectCTOFacts } from '../leadership/cto-collector';

export function leadershipContext(entries: OfficeEntry[], viewedProject: string) {
    const scoped = knowledgeEntries(entries);
    return { viewedProject, projects: scoped.map(entry => ({ project: entry.store.project,
        goalEvidence: collectCTOFacts([entry], entry.store.clock.now().toISOString()).projects[0], itReports: entry.store.state.it?.reports.slice(-3) || [],
        goals: entry.store.state.goals, notes: entry.store.state.projectNotes.slice(-20), tickets: entry.store.state.tickets.map(t => ({ key: t.key, summary: t.summary, stage: t.stage, activity: t.activity, blocker: t.blocker })), github: entry.store.state.github, azure: entry.store.state.azure,
    })), history: scoped.flatMap(({ store }) => store.state.messages.filter(m => m.to === 'cto' || m.from === 'cto').map(m => ({ project: store.project.name, ...m }))).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-30) };
}
