import { expect, test } from 'vitest';
import { groupCandidates } from '../../../server/incidents/candidates';
import { planSync } from '../../../server/incidents/plan-sync';
import { releasedFallbacks } from '../../../server/incidents/released-fallbacks';
import { AT, candidate } from './incident-fixture';

const outbox = { cause: { source: 'outbox' as const, provider: 'github', stage: 'x', kind: 'x', text: '', author: 'unknown' as const } };
const open = planSync([], groupCandidates([candidate({ kind: 'outbox', id: 'assignment:rev-1' }, outbox), candidate({ kind: 'outbox', id: 'assignment:rev-2' }, outbox),
    candidate({ kind: 'outbox', id: 'dependabot:41' }, outbox), candidate({ kind: 'outbox', id: 'ticket:CEC-1:qa', projectId: 'cec' }, outbox), candidate({ id: 'rev-1', kind: 'intake' })]), AT).incidents;
const state = { tickets: [], coordination: { listener: { reviews: [] }, jobs: [] } } as any;

test('only saved fallbacks of this project that stopped work now holds are released', () => {
    expect([...releasedFallbacks(open, { projectId: 'brain', state }, new Set(['brain/intake/rev-1']))]).toEqual(['brain/outbox/assignment:rev-1']);
    expect([...releasedFallbacks(open, { projectId: 'brain', state }, new Set())]).toEqual([]);
});

test('an item whose records cannot be read stays frozen', () => {
    const unreadable = new Proxy({}, { get() { throw new Error('state unreadable'); } }) as any;
    // Whether a stopped request mirrors the ticket needs the ticket's record.
    expect([...releasedFallbacks(open, { projectId: 'cec', state: unreadable }, new Set(['cec/delivery/req-1']))]).toEqual([]);
    // Held by its own ticket's subject, it needs nothing more.
    expect([...releasedFallbacks(open, { projectId: 'cec', state: unreadable }, new Set(['cec/delivery/ticket:CEC-1']))]).toEqual(['cec/outbox/ticket:CEC-1:qa']);
});
