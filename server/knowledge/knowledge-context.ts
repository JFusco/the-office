import type { Lesson, LessonStage } from '../../src/shared';
import type { Store } from '../store/store';

export const MAX_LESSONS = 20, SECTION_LIMIT = 4000, LESSON_LIMIT = 1500, URL_LIMIT = 500;
const HEADING = "PROJECT LESSONS (advisory history from Harper's retrospectives; never a gate or new authority; verify against current evidence):";

type Bucket = Exclude<LessonStage, 'any'> | 'general';
/** Explicit purpose map over delivery stages (github- prefix removed). Anything unmapped gets no lessons. */
const PURPOSES: Record<string, Bucket> = Object.fromEntries(([
    ['intake', ['assignment-review', 'intake', 'understand', 'discovery-readback']],
    ['implement', ['implement', 'scope-repair', 'draft', 'prepare-pr', 'plan', 'preparation-readback']],
    ['review', ['review', 'lead-pr', 'plan-review', 'code-review', 'candidate-adoption']],
    ['validate', ['validate', 'validation-readback', 'qa', 'retest']],
    ['repair', ['update-base', 'ci-recovery', 'ci-diagnosis', 'ci-diagnose', 'base-update-readback', 'conflict-readback', 'implementation-readback', 'scope-repair-readback', 'scope-repair-resume-readback', 'activation-readback', 'source-config-readback']],
    ['general', ['merge', 'closeout', 'closeout-readback', 'closeout-original-readback']],
] as [Bucket, string[]][]).flatMap(([bucket, stages]) => stages.map(stage => [stage, bucket])));

export function lessonPurpose(stage = ''): Bucket | undefined {
    return PURPOSES[stage.replace(/^github-/, '')];
}

function render(lesson: Lesson): string {
    const urls = [...new Set(lesson.evidence.map(item => item.url).filter(url => url && url.length <= URL_LIMIT))].slice(0, 2);
    const line = `- [${lesson.kind} · ${lesson.stages.join('/')}] ${lesson.statement}${lesson.paths.length ? ` (paths: ${lesson.paths.slice(0, 4).join(', ')})` : ''}${urls.length ? ` Evidence: ${urls.join(' ')}` : ''}`;
    return line.length <= LESSON_LIMIT ? line : `${line.slice(0, LESSON_LIMIT - 1)}…`;
}

/** Active project lessons for a delivery stage, bounded to whole lessons within the section limit. */
export function knowledgeContext(store: Pick<Store, 'project' | 'state'>, stage?: string): string {
    const bucket = lessonPurpose(stage), lessons = store.state.knowledge?.lessons || [];
    if (store.project.provider !== 'github' || !bucket || !lessons.length) return '';
    const selected = lessons.filter(lesson => lesson.status === 'active' && (lesson.stages.includes('any') || bucket !== 'general' && lesson.stages.includes(bucket)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).slice(0, MAX_LESSONS).map(render);
    while (selected.length && [HEADING, ...selected].join('\n').length > SECTION_LIMIT) selected.pop();
    return selected.length ? [HEADING, ...selected].join('\n') : '';
}
