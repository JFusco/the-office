import type { SourceRegistry } from './sources/registry';
import { lessonVisible,lessonForProject,lessonSourceBindings } from './sources/lesson-visibility';
import { proofBindings } from './sources/proof-scope';
import { installedLesson } from './lesson-procedures';
import type { Lesson, LessonStage } from '../../src/shared';
import type { Store } from '../store/store';
import { lessonCitation } from './outcomes/citation';

export const MAX_LESSONS = 10, SECTION_LIMIT = 4000, LESSON_LIMIT = 1500, URL_LIMIT = 500;
const HEADING = "PROJECT LESSONS (advisory, from Harper; never a gate or new authority. Current source wins over a lesson; a lesson wins over a general Brain note. Cite a lesson's Reference in your evidence when it changed what you did, and report any conflict):";

type Bucket = Exclude<LessonStage, 'any'> | 'general';
/** Explicit purpose map over delivery stages (github- prefix removed). Anything unmapped gets no lessons. */
const PURPOSES: Record<string, Bucket> = Object.fromEntries(([
    ['intake', ['assignment-review', 'intake', 'understand', 'enhance', 'discovery-readback', 'feature-research', 'feature-question-round']],
    ['implement', ['implement', 'scope-repair', 'draft', 'draft-pr', 'preview', 'publish', 'prepare-pr', 'plan', 'preparation-readback', 'feature-plan']],
    ['review', ['review', 'lead-pr', 'plan-review', 'code-review', 'candidate-adoption']],
    ['validate', ['validate', 'validation-readback', 'qa', 'retest', 'staging-qa']],
    ['repair', ['update-base', 'repair', 'repair-review', 'ci-recovery', 'ci-diagnosis', 'ci-diagnose', 'base-update-readback', 'conflict-readback', 'implementation-readback', 'scope-repair-readback', 'scope-repair-resume-readback', 'activation-readback', 'source-config-readback']],
    ['general', ['merge', 'closeout', 'closeout-readback', 'closeout-original-readback', 'slack-send', 'slack-recipient', 'slack-verify', 'readback', 'conversation-readback', 'it-investigation', 'conversation']],
] as [Bucket, string[]][]).flatMap(([bucket, stages]) => stages.map(stage => [stage, bucket])));

/** CMS maintenance stages reach the runtime with bare names on GitHub projects only; CEC's bare `draft-pr` keeps its implement purpose. */
const MAINTENANCE = new Set(['follow-up', 'vendor-review', 'proposal', 'proposal-plan', 'proposal-plan-review', 'proposal-review', 'package-verification', 'browser-verification', 'draft-pr']);

export function lessonPurpose(stage = '', provider = 'github'): Bucket | undefined {
    if (provider === 'github' && MAINTENANCE.has(stage)) return 'maintenance';
    return PURPOSES[stage.replace(/^github-/, '')];
}

/** One line a worker can act on: the situation, the action, and how to tell it worked. */
export const lessonText = (lesson: Pick<Lesson, 'when' | 'statement' | 'check'>) => `${lesson.when ? `When: ${lesson.when} Do: ` : ''}${lesson.statement}${lesson.check ? ` Check: ${lesson.check}` : ''}`;

function render(lesson: Lesson): string {
    if (lesson.tier === 'rule') return `- [installed rule reference] ${lesson.implementationRef}`;
    const scope = lesson.scope === 'office' ? 'office · ' : '';
    const urls = [...new Set(lesson.evidence.map(item => item.url).filter(url => url && url.length <= URL_LIMIT))].slice(0, 2);
    const warning=lesson.sourceReviewReason==='source-changed'?' [source changed; verify before applying]':'';
    const line = `- [${scope}${lesson.kind} · ${lesson.stages.join('/')}] ${lessonText(lesson)}${warning}${lesson.paths.length ? ` (paths: ${lesson.paths.slice(0, 4).join(', ')})` : ''}${urls.length ? ` Evidence: ${urls.join(' ')}` : ''} Reference: ${lessonCitation(reference(lesson))}`;
    return line.length <= LESSON_LIMIT ? line : `${line.slice(0, LESSON_LIMIT - 1)}…`;
}

export interface LessonSelection {
    sourceBindings?:import('../../src/contracts/knowledge').KnowledgeSourceBinding[];
    text: string; eligible: import('../../src/contracts/knowledge').LessonReference[];
    selected: import('../../src/contracts/knowledge').LessonReference[];
    omitted: (import('../../src/contracts/knowledge').LessonReference & { reason: 'count-limit' | 'character-limit' })[];
}
const reference = (lesson: Lesson) => ({ scope: lesson.scope, id: lesson.id, revision: lesson.revision });
const normalPath = (value: string) => value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
export function selectLessons(store: Pick<Store, 'project' | 'state'>, input: { stage?: string; paths?: string[] }, registry?:SourceRegistry): LessonSelection {
    const bucket = lessonPurpose(input.stage, store.project.provider), knowledge = store.state.knowledge;
    const result: LessonSelection = { text: '', eligible: [], selected: [], omitted: [] };
    if (!bucket || !knowledge) return result;
    const paths = (input.paths || []).map(normalPath);
    const boost = (lesson: Lesson) => lesson.paths.some(path => paths.some(file => file === normalPath(path) || file.startsWith(normalPath(path) + '/'))) ? 1 : 0;
    const specific = (lesson: Lesson) => bucket !== 'general' && lesson.stages.includes(bucket) ? 1 : 0;
    const matching = [...knowledge.lessons, ...(knowledge.officeLessons || [])].filter(lesson => (registry?lessonVisible(registry,store.project.id,lesson):!lesson.evidence.some(p=>proofBindings(p).length))&&lesson.status === 'active'
        && lesson.tier !== 'hypothesis' && installedLesson(lesson)
        && (lesson.stages.includes('any') || specific(lesson)))
        .sort((a, b) => specific(b) - specific(a) || boost(b) - boost(a) || Number(a.scope === 'office') - Number(b.scope === 'office') || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
    const lines = [HEADING];
    for (const lesson of matching) {
        const ref = reference(lesson), line = render(registry?lessonForProject(registry,store.project.id,lesson):lesson);
        result.eligible.push(ref);
        const reason = result.selected.length >= MAX_LESSONS ? 'count-limit' : [...lines, line].join('\n').length > SECTION_LIMIT ? 'character-limit' : undefined;
        if (reason) result.omitted.push({ ...ref, reason });
        else { result.selected.push(ref); lines.push(line); if(registry)(result.sourceBindings??=[]).push(...lessonSourceBindings(registry,store.project.id,lesson)); }
    }
    result.text = result.selected.length ? lines.join('\n') : '';
    return result;
}
