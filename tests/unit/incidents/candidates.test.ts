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

test('a candidate reported as folded only is taken in by the record that covers it, and is nothing where none does', () => {
    const cause = { source: 'worker-failure' as const, provider: 'codex', stage: 'review', kind: 'other', text: 'usage limit', author: 'harness' as const };
    const past = candidate({ kind: 'worker', id: 'run-old' }, { cause, expected: 'authentication', foldedOnly: true });
    const kept = candidate({ kind: 'worker', id: 'run-new' }, { cause });
    const job = candidate({ id: 'job-1', lastWorker: 'run-old' }, { absorbs: ['brain/worker/run-old'] });
    for (const order of [[past, kept, job], [job, kept, past]]) {
        const subjects = [...groupCandidates(order).values()].flatMap(incident => [...incident.subjects.entries()]);
        expect(subjects.map(([key]) => key).sort()).toEqual(['brain/delivery/job-1', 'brain/worker/run-new']);
        expect(subjects.find(([key]) => key === 'brain/delivery/job-1')![1]).toMatchObject({ sources: ['stopped-work', 'worker-failure'], expected: 'authentication' });
    }
    expect(groupCandidates([past]).size).toBe(0);
    expect([...groupCandidates([past, kept]).values()].flatMap(incident => [...incident.subjects.keys()])).toEqual(['brain/worker/run-new']);
    // The same candidate without the mark is a subject of its own.
    expect(groupCandidates([{ ...past, foldedOnly: undefined }]).size).toBe(1);
});

test('what each source said is kept apart, the owner\'s included, even where an earlier report masks it', () => {
    const worker = candidate({ kind: 'worker', id: 'run-1' }, { expected: 'authentication', cause: { source: 'worker-failure', provider: 'claude', stage: 'conversation', kind: 'authentication', text: 'signed out', author: 'harness' } });
    const delivery = candidate({ kind: 'slack-delivery', id: 'msg-1', unsettledEffect: true }, { expected: 'uncertain-effect', cause: { source: 'slack-delivery', provider: 'slack', stage: 'person', kind: 'uncertain', text: 'read-back did not match', author: 'harness' } });
    const conversation = candidate({ kind: 'conversation', id: 'msg-1', lastWorker: 'run-1' }, { absorbs: ['brain/worker/run-1', 'brain/slack-delivery/msg-1'] });
    const subject = [...groupCandidates([conversation, worker, delivery]).values()][0].subjects.get('brain/conversation/msg-1')!;
    expect(subject).toMatchObject({ expected: 'authentication', sources: ['stopped-work', 'worker-failure', 'slack-delivery'], subject: { unsettledEffect: true } });
    expect(subject.contributions).toEqual({ 'stopped-work': { unsettledEffect: false, expected: null }, 'worker-failure': { unsettledEffect: false, expected: 'authentication' }, 'slack-delivery': { unsettledEffect: true, expected: 'uncertain-effect' } });
});
