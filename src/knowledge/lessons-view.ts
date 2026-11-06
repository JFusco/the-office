import type { KnowledgeState, Lesson, PendingRetrospective, RetrospectiveRecord } from '../shared';

export interface LessonsView {
    enabled: boolean;
    active: Lesson[];
    retired: Lesson[];
    recent: RetrospectiveRecord[];
    pending: PendingRetrospective[];
}
const newest = <T extends { id: string }>(at: (item: T) => string) => (a: T, b: T) => at(b).localeCompare(at(a)) || a.id.localeCompare(b.id);

/** Display grouping for the Lessons panel. Pure; ordering matches the prompt's newest-first selection. */
export function lessonsView(knowledge: KnowledgeState | undefined): LessonsView {
    const lessons = knowledge?.lessons || [];
    return {
        enabled: knowledge?.enabled ?? false,
        active: lessons.filter(lesson => lesson.status === 'active').sort(newest(lesson => lesson.createdAt)),
        retired: lessons.filter(lesson => lesson.status === 'retired').sort(newest(lesson => lesson.retiredAt || lesson.updatedAt)),
        recent: (knowledge?.retrospectives || []).slice().sort(newest(record => record.at)).slice(0, 10),
        pending: (knowledge?.pending || []).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    };
}

export const TRIGGER_LABEL: Record<RetrospectiveRecord['trigger'], string> = { completed: 'Completed', parked: 'Parked in Block', retired: 'Retired', 'repair-budget': 'Repair budget used up' };
