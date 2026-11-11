import { expect, test } from 'vitest';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { reconcileBlockerFollowups } from '../../../server/knowledge/blocker-followups';
import { catalogLine } from '../../../server/knowledge/lookup/catalog-line';
import { unblockBrief } from '../../../server/knowledge/unblock-brief';
import { job, knowledgeStore, learningLesson } from './knowledge-fixture';

const unblock = { known: 'The live PR body fails lint:pr.', decision: 'A metadata-only blocker is not a source repair.', next: 'Morgan republishes the validated body.' };
const catalog = { now: { kind: 'learning' as const, ref: 'now', url: '', detail: 'Current run' } };

test('a parked run stores Harper\'s brief for that subject; it is shown until the blocker is confirmed resolved', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, blocked = job({ status: 'blocked', detail: 'PR body invalid' });
        store.state.coordination!.jobs!.push(blocked);
        const accept = (id: string, trigger: 'parked' | 'completed', jobId: string) => acceptRetrospective(store, { id, jobId, key: 'GH-1', trigger }, { catalog }, { summary: 'Done', lessons: [], unblock }, 'claim');
        accept('r-done', 'completed', 'other-job');
        expect(k.unblockBriefs).toBeUndefined();
        accept('r-parked', 'parked', blocked.id);
        const text = unblockBrief(k, { kind: 'job', id: blocked.id });
        expect(text).toContain('UNBLOCK BRIEF'); expect(text).toContain(`Known: ${unblock.known}`); expect(text).toContain(`Next: ${unblock.next}`);
        expect(unblockBrief(k, { kind: 'job', id: 'other-job' })).toBe('');
        expect(unblockBrief(k, undefined)).toBe('');

        reconcileBlockerFollowups(store);
        expect(unblockBrief(k, { kind: 'job', id: blocked.id })).not.toBe('');
        blocked.status = 'completed'; reconcileBlockerFollowups(store);
        expect(unblockBrief(k, { kind: 'job', id: blocked.id })).toBe('');
    } finally { close(); }
});

test('a brief built from source-scoped evidence is not kept', () => {
    const { store, close } = knowledgeStore();
    try {
        const scoped = { src: { kind: 'source' as const, ref: 'src', url: '', detail: 'x', source: { sourceId: 's', unitId: 'u', version: 'v' }, sourceBindings: [{ sourceId: 's', unitId: 'u', version: 'v' }] } };
        const scan = { version: 1 as const, inputSha256: '', scannerVersion: 't', policyVersion: 't', clean: true, findings: [] };
        try { acceptRetrospective(store, { id: 'r', jobId: 'j', key: 'GH-1', trigger: 'parked' }, { catalog: scoped }, { summary: 'Done', lessons: [], unblock }, 'claim', scan as never); } catch { /* a mismatched receipt is refused, which also keeps the brief out */ }
        expect(store.state.knowledge!.unblockBriefs).toBeUndefined();
    } finally { close(); }
});

test('the catalog line names lessons that were not supplied and stays quiet about supplied ones', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!;
        k.lessons = [learningLesson('given', { when: 'Supplied situation' }), learningLesson('other', { when: 'Reviewing a lockfile change' }), learningLesson('idea', { tier: 'hypothesis', when: 'Unverified idea' }), learningLesson('old', { status: 'retired', when: 'Retired situation' })];
        const line = catalogLine(k, { selected: [{ scope: 'project', id: 'given', revision: 1 }] });
        expect(line).toContain('1 more lesson for other stages, for example: Reviewing a lockfile change');
        for (const absent of ['Supplied situation', 'Unverified idea', 'Retired situation']) expect(line).not.toContain(absent);
        expect(catalogLine(undefined, { selected: [] })).toBe('ALSO AVAILABLE BY LOOKUP: Brain technology notes (frameworks and CMS platforms).');
    } finally { close(); }
});
