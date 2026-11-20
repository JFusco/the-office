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
