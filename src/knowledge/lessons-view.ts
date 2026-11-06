import type { KnowledgeState, Lesson, OfficeKnowledge, OfficeProposal, PendingRetrospective, RetrospectiveRecord, WeeklyRollup } from '../shared';

export interface LessonsView {
    enabled: boolean;
    active: Lesson[];
    ineffective: Lesson[];
    retired: Lesson[];
    agentsSuggestions: Lesson[];
    officeProposals: OfficeProposal[];
    officeLessons: Lesson[];
    rollups: WeeklyRollup[];
    rollupError: string;
    recent: RetrospectiveRecord[];
    pending: PendingRetrospective[];
}
const newest = <T extends { id: string }>(at: (item: T) => string) => (a: T, b: T) => at(b).localeCompare(at(a)) || a.id.localeCompare(b.id);

/** Display grouping for the Lessons panel. Pure; ordering matches the prompt's newest-first selection. */
export function lessonsView(knowledge: KnowledgeState | undefined, office?: OfficeKnowledge): LessonsView {
    const lessons = knowledge?.lessons || [];
    return {
        enabled: knowledge?.enabled ?? false,
        active: lessons.filter(lesson => lesson.status === 'active').sort(newest(lesson => lesson.createdAt)),
        ineffective: lessons.filter(lesson => lesson.status === 'ineffective').sort(newest(lesson => lesson.updatedAt)),
        retired: lessons.filter(lesson => lesson.status === 'retired').sort(newest(lesson => lesson.retiredAt || lesson.updatedAt)),
        agentsSuggestions: lessons.filter(lesson => lesson.status !== 'retired' && lesson.repositoryInstruction && lesson.repositoryInstruction.status !== 'declined').sort(newest(lesson => lesson.createdAt)),
        officeProposals: (office?.proposals || []).filter(proposal => proposal.status === 'proposed').sort(newest(proposal => proposal.createdAt)),
        officeLessons: (office?.lessons || knowledge?.officeLessons || []).filter(lesson => lesson.status === 'active').sort(newest(lesson => lesson.createdAt)),
        rollups: (knowledge?.rollups || []).slice().sort(newest(rollup => rollup.weekEnding)).slice(0, 4),
        rollupError: knowledge?.rollupRetry?.lastError || '',
        recent: (knowledge?.retrospectives || []).slice().sort(newest(record => record.at)).slice(0, 10),
        pending: (knowledge?.pending || []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    };
}

export const TRIGGER_LABEL: Record<RetrospectiveRecord['trigger'], string> = { completed: 'Completed', parked: 'Parked in Block', retired: 'Retired', 'repair-budget': 'Repair budget used up' };

/** The roll-up table's rows: label and a formatter per metric. */
export const ROLLUP_ROWS: [string, (rollup: WeeklyRollup) => string][] = [
    ['Completed', rollup => String(rollup.metrics.completed)],
    ['Parked', rollup => String(rollup.metrics.parked)],
    ['Repair rounds', rollup => String(rollup.metrics.repairAttempts)],
    ['Reroutes', rollup => String(rollup.metrics.reroutes)],
    ['CI repairs', rollup => String(rollup.metrics.ciRepairs)],
    ['Block hours (median)', rollup => rollup.metrics.medianBlockHours === null ? '—' : String(rollup.metrics.medianBlockHours)],
    ['Lessons added', rollup => String(rollup.metrics.lessonsAdded)],
    ['Recurrences', rollup => String(rollup.metrics.recurrences)],
];
