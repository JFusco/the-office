import { expect, test } from 'vitest';
import { attributedRecords } from '../../../server/incidents/attributed-records';
import { groupCandidates } from '../../../server/incidents/candidates';
import { frozenKey, planSync } from '../../../server/incidents/plan-sync';
import { AT, candidate } from './incident-fixture';

const open = planSync([], groupCandidates([
    candidate({ id: 'job-1', lastWorker: 'run-7' }),
    candidate({ kind: 'conversation', id: 'msg-1' }),
    candidate({ kind: 'notice', id: 'n-1', projectId: 'cms-field-vocabulary' }),
    candidate({ kind: 'outbox', id: 'item-1', lastWorker: 'run-9' }, { cause: { source: 'outbox', provider: 'github', stage: 'x', kind: 'x', text: 'needs a look', author: 'harness' } }),
]), AT).incidents;

test('nothing is attributed while every stopped record can be read', () => {
    expect([...attributedRecords(open, new Set())]).toEqual([]);
    expect([...attributedRecords(open, new Set([frozenKey('brain', 'outbox')]))]).toEqual([]);
});

test('while a project\'s stopped work cannot be seen, its open subjects keep the run and the delivery they hold', () => {
    expect([...attributedRecords(open, new Set([frozenKey('brain', 'stopped-work')]))].sort()).toEqual(['brain/slack-delivery/msg-1', 'brain/worker/run-7']);
    expect([...attributedRecords(open, new Set([frozenKey('cms-field-vocabulary', '*')]))]).toEqual(['cms-field-vocabulary/slack-delivery/n-1']);
});

test('a cleared subject holds nothing', () => {
    const cleared = planSync(open, new Map(), new Date(AT.getTime() + 60_000)).incidents;
    expect([...attributedRecords(cleared, new Set([frozenKey('brain', 'stopped-work')]))]).toEqual([]);
});

const by = (source: 'outbox' | 'provider-error' | 'it-recovery') => ({ cause: { source, provider: 'github', stage: 'x', kind: 'x', text: source, author: 'harness' as const } });
const owners = planSync([], groupCandidates([
    candidate({ kind: 'outbox', id: 'ticket:CEC-7:qa', lastWorker: 'run-t' }, by('outbox')),
    candidate({ kind: 'outbox', id: 'dependabot:41', lastWorker: 'run-d' }, by('outbox')),
    candidate({ kind: 'provider', id: 'intake', lastWorker: 'run-i' }, by('provider-error')),
    candidate({ kind: 'it-recovery', id: 'rec-1', lastWorker: 'run-r' }, by('it-recovery')),
]), AT).incidents;

test('a ticket\'s or review\'s outbox item and the mailbox error keep their run while they cannot be seen; a recovery keeps its run apart', () => {
    const held = (frozen: string[], released: string[] = []) => [...attributedRecords(owners, new Set(frozen), new Set(released))].sort();
    expect(held([frozenKey('brain', 'outbox')])).toEqual(['brain/worker/run-t']);
    expect(held([frozenKey('brain', 'provider-error')])).toEqual(['brain/worker/run-i']);
    // A mailbox check under way hides only its own subject.
    expect(held(['brain/provider/intake'])).toEqual(['brain/worker/run-i']);
    expect(held([frozenKey('brain', 'it-recovery')])).toEqual([]);
    // A fallback shown to be another record's subject gives its run up.
    expect(held([frozenKey('brain', 'outbox')], ['brain/outbox/ticket:CEC-7:qa'])).toEqual([]);
});

test('the owner is the incident\'s source, even once it has withdrawn its own part of the subject', () => {
    const withdrawn = structuredClone(open);
    withdrawn.find(incident => incident.subjects.some(subject => subject.id === 'job-1'))!.subjects.find(subject => subject.id === 'job-1')!.sources = ['worker-failure'];
    expect([...attributedRecords(withdrawn, new Set([frozenKey('brain', 'stopped-work')]))]).toContain('brain/worker/run-7');
});
