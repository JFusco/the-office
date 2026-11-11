import { expect, test } from 'vitest';
import { acceptRetrospective } from '../../../server/knowledge/accept-retrospective';
import { reconcileBlockerFollowups } from '../../../server/knowledge/blocker-followups';
import { catalogLine } from '../../../server/knowledge/lookup/catalog-line';
import { unblockBrief } from '../../../server/knowledge/unblock-brief';
import { digest } from '../../../server/knowledge/slack-intake/config';
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
        const result = { summary: 'Done', lessons: [], unblock };
        const scan = { version: 1 as const, inputSha256: digest(JSON.stringify(result)), scannerVersion: 't', policyVersion: 't', clean: true, findings: [] };
        acceptRetrospective(store, { id: 'r', jobId: 'j', key: 'GH-1', trigger: 'parked' }, { catalog: scoped }, result, 'claim', scan);
        expect(store.state.knowledge!.retrospectives.some(record => record.id === 'r')).toBe(true);
        expect(store.state.knowledge!.unblockBriefs).toBeUndefined();
    } finally { close(); }
});

test('a retrospective accepted after the blocker is confirmed resolved leaves no brief behind', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, blocked = job({ status: 'blocked', detail: 'PR body invalid' });
        store.state.coordination!.jobs!.push(blocked);
        reconcileBlockerFollowups(store);
        blocked.status = 'completed'; reconcileBlockerFollowups(store);
        acceptRetrospective(store, { id: 'r-late', jobId: blocked.id, key: 'GH-1', trigger: 'parked' }, { catalog }, { summary: 'Done', lessons: [], unblock }, 'claim');
        expect(unblockBrief(k, { kind: 'job', id: blocked.id })).not.toBe('');
        reconcileBlockerFollowups(store);
        expect(unblockBrief(k, { kind: 'job', id: blocked.id })).toBe('');
        expect(k.followups!.find(item => item.id === `job:${blocked.id}`)!.disposition).toBe('confirmed');
        const persisted = JSON.parse((store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body).knowledge;
        expect(persisted.unblockBriefs?.[`job:${blocked.id}`]).toBeUndefined();
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
        const binding = { sourceId: 's', unitId: 'u', version: 'v' };
        k.lessons.push(learningLesson('bound', { when: 'Source-bound situation', evidence: [{ kind: 'source', ref: 'src', url: '', detail: 'x', sourceBindings: [binding] }] }), learningLesson('sourced', { when: 'Sourced situation', evidence: [{ kind: 'source', ref: 'src', url: '', detail: 'x', source: binding }] }));
        const scopedLine = catalogLine(k, { selected: [{ scope: 'project', id: 'given', revision: 1 }] });
        expect(scopedLine).toContain('1 more lesson for other stages');
        for (const absent of ['Source-bound situation', 'Sourced situation']) expect(scopedLine).not.toContain(absent);
        expect(catalogLine(undefined, { selected: [] })).toBe('ALSO AVAILABLE BY LOOKUP: Brain technology notes (frameworks and CMS platforms).');
    } finally { close(); }
});
