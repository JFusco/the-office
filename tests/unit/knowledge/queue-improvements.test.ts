import { test, expect } from 'vitest';
import { queueImprovements } from '../../../server/knowledge/queue-improvements';
import { admitImprovement } from '../../../server/knowledge/admit-improvement';
import { improvementIntakeGate } from '../../../server/knowledge/improvement-intake-gate';
import { improvementFixture } from './improvement-fixture';
test('one operations request per eligible candidate; paused projects and full reservations wait', () => {
    const f = improvementFixture();
    try {
        f.store.state.paused = true; queueImprovements(f.store); expect(f.store.state.coordination!.requests || []).toEqual([]);
        f.store.state.paused = false; queueImprovements(f.store); queueImprovements(f.store);
        expect(f.store.state.coordination!.requests).toHaveLength(1);
        expect(f.store.state.coordination!.requests![0]).toMatchObject({ action: 'admit-improvement', lane: 'operations' });
    } finally { f.close(); }
});
type Fixture = ReturnType<typeof improvementFixture>;
const queued = (f: Fixture) => (f.store.state.coordination!.requests || []).filter(request => request.action === 'admit-improvement' && request.status === 'queued');
/** The executor's contract: admitImprovement returns normally, so the request completes. The fixture provider stands in for the live one. */
async function executeQueued(f: Fixture) {
    const [request] = queued(f); expect(queued(f)).toHaveLength(1);
    request.status = 'working'; await admitImprovement(f.store, request.head, f.provider); request.status = 'completed';
}
const untilDeadline = (f: Fixture) => f.advance(Date.parse(f.item.nextCheckAt!) - f.store.clock.now().getTime());
for (const project of ['brain', 'cec']) test(`${project}: a lost create is re-queued for read-back at its deadline, never resent, and releases the intake fence`, async () => {
    const f = improvementFixture(project);
    try {
        f.failCreate(); f.found(false);
        queueImprovements(f.store); await executeQueued(f);
        expect(f.item.status).toBe('uncertain'); expect(Date.parse(f.item.nextCheckAt!)).toBeGreaterThan(f.store.clock.now().getTime());
        expect(improvementIntakeGate(f.store, 'GH-999').allowed).toBe(false);
        queueImprovements(f.store); queueImprovements(f.store); expect(queued(f)).toEqual([]);
        untilDeadline(f); queueImprovements(f.store); queueImprovements(f.store);
        expect(queued(f)).toHaveLength(1); expect(queued(f)[0]).toMatchObject({ head: f.item.id, lane: 'operations' });
        const first = f.item.nextCheckAt;
        await executeQueued(f);
        expect(f.item.status).toBe('uncertain'); expect(f.counts().creates).toBe(1);
        expect(Date.parse(f.item.nextCheckAt!)).toBeGreaterThan(f.store.clock.now().getTime()); expect(f.item.nextCheckAt).not.toBe(first);
        queueImprovements(f.store); expect(queued(f)).toEqual([]);
        untilDeadline(f); f.found(true); queueImprovements(f.store); await executeQueued(f);
        expect(f.item.status).toBe('open'); expect(f.counts()).toEqual({ creates: 1, assignments: 1 });
        expect(improvementIntakeGate(f.store, 'GH-999').allowed).toBe(true);
    } finally { f.close(); }
});
for (const control of ['paused', 'draining', 'disabled'] as const) test(`${control} after enqueue defers the proposal without writes and it is queued again`, async () => {
    const f = improvementFixture();
    try {
        const set = (on: boolean) => { if (control === 'paused') f.store.state.paused = on; else if (control === 'draining') f.store.state.draining = on; else f.store.state.knowledge!.enabled = !on; };
        queueImprovements(f.store);
        set(true); await executeQueued(f); set(false);
        expect(f.item).toMatchObject({ status: 'proposed', effectIds: [] }); expect(f.item.manifest).toBeUndefined();
        expect(f.counts()).toEqual({ creates: 0, assignments: 0 });
        queueImprovements(f.store); expect(queued(f)).toHaveLength(1);
        await executeQueued(f); expect(f.item.status).toBe('open');
    } finally { f.close(); }
});
test('a pause does not mask a simultaneous grant revocation', async () => {
    const f = improvementFixture();
    try {
        queueImprovements(f.store);
        f.store.state.paused = true; f.store.state.knowledge!.improvementGrant!.enabled = false;
        await executeQueued(f); f.store.state.paused = false;
        expect(f.item.status).toBe('needs-input'); expect(f.counts().creates).toBe(0);
    } finally { f.close(); }
});
test('existing reservations stay schedulable at the three-item cap while a fourth proposal waits', () => {
    const f = improvementFixture();
    try {
        f.store.state.knowledge!.improvements!.push(...(['reserved', 'publishing', 'uncertain'] as const).map(status => ({ ...structuredClone(f.item), id: `existing-${status}`, status })));
        queueImprovements(f.store); queueImprovements(f.store);
        expect(queued(f).map(request => request.head).sort()).toEqual(['existing-publishing', 'existing-reserved', 'existing-uncertain']);
        queued(f)[0].status = 'working'; queueImprovements(f.store);
        expect((f.store.state.coordination!.requests || []).filter(request => ['queued', 'working'].includes(request.status))).toHaveLength(3);
    } finally { f.close(); }
});
