import { expect, test } from 'vitest';
import { groupCandidates } from '../../../server/incidents/candidates';
import { candidate } from './incident-fixture';

test('the same harness cause in two projects is one incident with two subjects', () => {
    const grouped = groupCandidates([candidate({ projectId: 'brain', id: 'job-1' }), candidate({ projectId: 'cms-field-vocabulary', id: 'job-2' })]);
    expect(grouped.size).toBe(1);
    expect([...[...grouped.values()][0].subjects.keys()]).toEqual(['brain/delivery/job-1', 'cms-field-vocabulary/delivery/job-2']);
});

test('a model-written blocker with the same words on two subjects is two incidents', () => {
    const model = { cause: { source: 'stopped-work' as const, provider: 'github', stage: 'review', kind: 'scope', text: '', author: 'model' as const } };
    expect(groupCandidates([candidate({ id: 'job-1' }, model), candidate({ id: 'job-2' }, model)]).size).toBe(2);
});

test('two reports of the same subject are one subject; the first reported wins and both sources are kept', () => {
    const second = candidate({ id: 'job-1', stage: 'merge' }, { cause: { source: 'outbox', provider: 'github', stage: 'merge', kind: 'x', text: 'other', author: 'harness' }, evidence: 'second' });
    const grouped = groupCandidates([candidate({ id: 'job-1' }), second]);
    expect(grouped.size).toBe(1);
    expect([...grouped.values()][0].subjects.get('brain/delivery/job-1')).toMatchObject({ sources: ['stopped-work', 'outbox'], evidence: 'Worktree is missing', subject: { stage: 'review' } });
});

test('a record another candidate covers is folded into it, wherever it appears in the list', () => {
    const failure = candidate({ kind: 'worker', id: 'run-7' }, { cause: { source: 'worker-failure', provider: 'claude', stage: 'review', kind: 'timeout', text: 'timed out', author: 'harness' } });
    const job = candidate({ id: 'job-1', lastWorker: 'run-7' }, { absorbs: ['brain/worker/run-7'] });
    for (const order of [[failure, job], [job, failure]]) {
        const grouped = groupCandidates(order);
        expect(grouped.size).toBe(1);
        expect([...grouped.values()][0].subjects.get('brain/delivery/job-1')?.sources).toEqual(['stopped-work', 'worker-failure']);
    }
});

test('a covered record of another project is not folded', () => {
    const failure = candidate({ projectId: 'cms-field-vocabulary', kind: 'worker', id: 'run-7' }, { cause: { source: 'worker-failure', provider: 'claude', stage: 'review', kind: 'timeout', text: 'timed out', author: 'harness' } });
    expect(groupCandidates([candidate({ id: 'job-1' }, { absorbs: ['brain/worker/run-7'] }), failure]).size).toBe(2);
});

test('each subject keeps its own explanation through grouping', () => {
    const wait = { expected: 'provider-wait' as const };
    const [incident] = [...groupCandidates([candidate({ id: 'a' }, wait), candidate({ id: 'b' }), candidate({ id: 'c' }, { expected: 'hold' })]).values()];
    expect([...incident.subjects.values()].map(subject => subject.expected)).toEqual(['provider-wait', null, 'hold']);
});

test('a folded report still tells what it knew: an unsettled write, and an explanation where the owner has none', () => {
    const delivery = candidate({ kind: 'slack-delivery', id: 'msg-1', unsettledEffect: true }, { expected: 'uncertain-effect', cause: { source: 'slack-delivery', provider: 'slack', stage: 'person', kind: 'uncertain', text: 'read-back did not match', author: 'harness' } });
    const conversation = (over = {}) => candidate({ kind: 'conversation', id: 'msg-1' }, { absorbs: ['brain/slack-delivery/msg-1'], ...over });
    const owner = (grouped: ReturnType<typeof groupCandidates>) => [...grouped.values()][0].subjects.get('brain/conversation/msg-1')!;
    expect(owner(groupCandidates([conversation(), delivery]))).toMatchObject({ expected: 'uncertain-effect', sources: ['stopped-work', 'slack-delivery'], subject: { unsettledEffect: true } });
    // The owner's own typed restriction outranks what a folded report adds.
    expect(owner(groupCandidates([conversation({ expected: 'hold' }), delivery]))).toMatchObject({ expected: 'hold', subject: { unsettledEffect: true } });
    // The candidates handed in are not altered.
    const original = conversation();
    groupCandidates([original, delivery]);
    expect(original).toMatchObject({ expected: null, subject: { unsettledEffect: false } });
});

test('a record already attributed to a subject whose own source could not be read is left with it', () => {
    const failure = (id: string) => candidate({ kind: 'worker', id }, { cause: { source: 'worker-failure', provider: 'claude', stage: 'review', kind: 'timeout', text: 'timed out', author: 'harness' } });
    const grouped = groupCandidates([failure('run-7'), failure('run-8')], new Set(['brain/worker/run-7']));
    expect([...grouped.values()].flatMap(incident => [...incident.subjects.keys()])).toEqual(['brain/worker/run-8']);
});
