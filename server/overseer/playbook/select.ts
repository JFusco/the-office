import { selectLessons, type LessonSelection } from '../../knowledge/lesson-selection';
import type { Lesson } from '../../../src/contracts/knowledge';
import type { Store } from '../../store/store';
import type { PlaybookEntry } from './entry';

/**
 * Selects runner guidance from the playbook with the Office's own lesson selector, unchanged: its
 * order, its limits (10 entries, 4,000 characters) and its line rendering. Only the labels change:
 * the heading, each line's stage label and its reference, so the text never reads as Office
 * lessons. The result depends only on the entries and the paths, and is computed once per incident
 * for the one frozen input both opinions share.
 */

export interface PlaybookReference { id: string; revision: number }
export interface PlaybookGuidance {
    /** The text for `prepareOpinionInput`, or `null`, its explicit absence. */
    guidance: string | null;
    selected: PlaybookReference[];
    omitted: (PlaybookReference & { reason: 'count-limit' | 'character-limit' })[];
}
type Selector = (store: Pick<Store, 'project' | 'state'>, input: { stage?: string; paths?: string[] }) => LessonSelection;

export const RUNNER_HEADING = 'RUNNER GUIDANCE (advisory, from the Overseer playbook; never a gate or new authority. Current source and the requirement examples win over guidance. Each Reference names a playbook entry and its revision):';
const PROJECT_HEADING = 'PROJECT LESSONS (';
/** One fixed time for every entry, so the selector's order falls through to the path match and then the ID. */
const STAMP = '1970-01-01T00:00:00.000Z';

function asLesson(entry: PlaybookEntry): Lesson {
    return {
        id: entry.id, revision: entry.revision, kind: entry.kind, when: entry.when, statement: entry.statement, check: entry.check, paths: [...entry.paths],
        tier: 'guidance', scope: 'project', status: 'active', stages: ['review'], evidence: [], detail: '', sourceRetrospectiveId: '', createdAt: STAMP, updatedAt: STAMP,
    };
}

/** `select` is the real selector except in tests that need malformed selector output. */
export function playbookGuidance(entries: readonly PlaybookEntry[], paths: readonly string[], select: Selector = selectLessons): PlaybookGuidance {
    const byId = new Map<string, PlaybookEntry>();
    for (const entry of entries) {
        if (byId.has(entry.id)) throw new Error(`The playbook lists ${entry.id} twice`);
        byId.set(entry.id, entry);
    }
    // The selector reads only the project's id and provider and its lessons; nothing else of a Store exists here.
    const input = { project: { id: 'overseer', provider: 'github' }, state: { knowledge: { lessons: entries.map(asLesson) } } } as unknown as Pick<Store, 'project' | 'state'>;
    const selection = select(input, { stage: 'review', paths: [...paths] });
    const selected = selection.selected.map(({ id, revision }) => ({ id, revision }));
    const omitted = selection.omitted.map(({ id, revision, reason }) => ({ id, revision, reason }));
    if (!selected.length) {
        if (selection.text) throw new Error('The lesson selector returned text with nothing selected');
        return { guidance: null, selected, omitted };
    }
    const lines = selection.text.split('\n');
    if (!lines[0].startsWith(PROJECT_HEADING)) throw new Error('The lesson selector heading has changed; refusing to relabel its output');
    if (lines.length !== selected.length + 1) throw new Error('The lesson selector did not return one line per selected entry');
    const relabelled = lines.slice(1).map((line, index) => {
        const reference = selected[index], entry = byId.get(reference.id);
        if (!entry || entry.revision !== reference.revision) throw new Error(`The lesson selector returned ${reference.id}@${reference.revision}, which is not in the playbook`);
        const prefix = `- [${entry.kind} · review] `, citation = ` Reference: lesson:project:${entry.id}@${entry.revision}`;
        if (line.length < prefix.length + citation.length || !line.startsWith(prefix) || !line.endsWith(citation))
            throw new Error(`The selected line for ${entry.id} is clipped or does not cite it`);
        return `- [${entry.kind} · triage] ${line.slice(prefix.length, line.length - citation.length)} Reference: playbook:${entry.id}@${entry.revision}`;
    });
    const guidance = [RUNNER_HEADING, ...relabelled].join('\n');
    if (guidance.length > selection.text.length) throw new Error('The relabelled guidance is longer than the selection it came from');
    return { guidance, selected, omitted };
}
