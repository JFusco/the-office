import { afterEach, expect, test } from 'vitest';
import { drainDelivery, requestDelivery } from '../../../server/cec/pilot-delivery';
import { latestAssessment, openAssessment } from '../../../server/features/handoff/disposition-store';
import { jiraBinding } from '../../../server/office/project-bindings';
import type { RepairResume } from '../../../src/contracts/work';
import type { DeliveryRequest } from '../../../src/shared';
import { handoffFixture } from '../features/handoff/fixture';

type Fixture = ReturnType<typeof handoffFixture>;
const open: Fixture[] = [];
afterEach(() => open.splice(0).forEach(f => f.close()));
const KEY = 'CEC-1';
const BINDING: RepairResume = { id: 'a'.repeat(64), incident: 'inc-1', subject: `cec/delivery/ticket:${KEY}`, digest: 'd'.repeat(64), fix: 'cli-bind-1', commit: 'f'.repeat(40), action: 'resume-ticket', payload: 'b'.repeat(64),
    release: { commit: 'e'.repeat(40), operation: 'deploy-1' }, admittedAt: '2026-11-10T12:00:00.000Z' };
/** A CEC project with intake assessment enabled and one pilot ticket stopped at QA. */
function project(ticket: Record<string, unknown> = {}) {
    const f = handoffFixture('cec'); open.push(f);
    f.store.state.tickets.push({ key: KEY, summary: 'Synthetic', stage: 'qa', activity: 'blocked', blocker: 'Error: the preview never answered', pilot: true, commit: 'abc1234', results: {}, ...ticket } as never);
    const queue = (routing?: Parameters<typeof requestDelivery>[3], action: 'start-pilot' | 'resume-ticket' = 'resume-ticket') => requestDelivery.call({ store: f.store } as never, KEY, action, undefined, routing) as DeliveryRequest;
    const admissions = () => (f.store.db.prepare("SELECT ref FROM admissions WHERE kind='delivery' ORDER BY seq").all() as { ref: string }[]).map(row => row.ref);
    return { ...f, queue, admissions, requests: () => f.store.state.deliveryQueue ?? [], episode: () => latestAssessment(f.store, KEY) };
}

test('a repair resume queues the ticket\'s own resume with its binding and touches no intake episode', () => {
    const p = project();
    const request = p.queue({ repairResume: BINDING });
    expect(request).toMatchObject({ key: KEY, action: 'resume-ticket', status: 'queued', error: '', repairResume: BINDING });
    // The binding is the request's own copy, not the caller's object.
    expect(request.repairResume).not.toBe(BINDING);
    expect(p.requests()).toEqual([request]);
    expect(p.admissions()).toEqual([request.id]);
    expect(p.store.state.events[0]).toMatchObject({ kind: 'delivery-queued', ticket: KEY });
    // No episode was opened to be closed: an ordinary resume opens one and closes it as a manual start.
    expect(p.episode()).toBeUndefined();
    const ordinary = project();
    expect(ordinary.queue().repairResume).toBeUndefined();
    expect(ordinary.episode()).toMatchObject({ outcome: 'ordinary-by-start' });
});

test('an intake episode that is open stays open, where an ordinary resume would close it as a manual start', () => {
    const p = project();
    openAssessment(p.store, KEY, 'v1', true);
    const before = JSON.stringify(p.episode());
    p.queue({ repairResume: BINDING });
    expect(JSON.stringify(p.episode())).toBe(before);
    expect(p.episode()!.closedAt).toBeUndefined();
    const ordinary = project();
    openAssessment(ordinary.store, KEY, 'v1', true);
    ordinary.queue();
    expect(ordinary.episode()).toMatchObject({ outcome: 'ordinary-by-start' });
});

test('a ticket enrolled in a feature whose gate permits delivery is resumed, and nothing of its feature or intake changes', () => {
    const p = project();
    p.store.state.features![0].publication.push({ id: 'item-1', key: KEY, startedApprovalId: 'approval-1', verified: true } as never);
    const features = JSON.stringify(p.store.state.features);
    expect(p.queue({ repairResume: BINDING })).toMatchObject({ repairResume: BINDING });
    expect(JSON.stringify(p.store.state.features)).toBe(features);
    expect(p.episode()).toBeUndefined();
});

test('the feature gate refuses a repair resume as it refuses any resume, and nothing is queued', () => {
    const p = project();
    // Enrolled, with no approval of the current plan and not started.
    p.store.state.features![0].publication.push({ id: 'item-1', key: KEY } as never);
    expect(() => p.queue()).toThrow(/Feature/);
    expect(() => p.queue({ repairResume: BINDING })).toThrow(/Feature/);
    expect(p.requests()).toEqual([]);
    expect(p.admissions()).toEqual([]);
});

test('a repair resume is a plain resume: with a feature binding, automatic intake, a QA handoff or as a start it is refused', () => {
    const p = project();
    const refusal = 'A repair resume is a plain resume: it takes no feature binding, automatic intake or QA handoff';
    expect(() => p.queue({ repairResume: BINDING, binding: { featureId: 'f' } as never })).toThrow(refusal);
    expect(() => p.queue({ repairResume: BINDING, automatic: true })).toThrow(refusal);
    expect(() => p.queue({ repairResume: BINDING, qaHandoff: {} })).toThrow(refusal);
    expect(() => p.queue({ repairResume: BINDING, qaHandoff: null })).toThrow(refusal);
    expect(() => p.queue({ repairResume: BINDING }, 'start-pilot')).toThrow(refusal);
    // Nor is it an operator's command: the Office queues it, and it must never read as a move by hand.
    expect(() => p.queue({ repairResume: BINDING, operator: true })).toThrow(refusal);
    expect(p.requests()).toEqual([]);
    const request = p.queue({ repairResume: BINDING, operator: false });
    expect(p.requests()).toEqual([request]);
    expect(request).toMatchObject({ action: 'resume-ticket', repairResume: BINDING });
    expect(request).not.toHaveProperty('operator');
    expect(p.episode()).toBeUndefined();
});

test('a request an operator\'s command creates is marked as the operator\'s; one any other path creates, and one that was already there, is not', () => {
    const p = project();
    const mine = p.queue({ operator: true });
    expect(mine).toMatchObject({ key: KEY, action: 'resume-ticket', status: 'queued', operator: true });
    // A second command finds that request and creates none; a path with no operator finds it too and does not take the mark off.
    expect(p.queue({ operator: true })).toBe(mine);
    expect(p.queue()).toBe(mine);
    expect(p.requests()).toEqual([mine]);
    mine.status = 'completed';
    for (const routing of [undefined, {}, { operator: false }, { automatic: true }]) {
        const theirs = p.queue(routing);
        expect('operator' in theirs, JSON.stringify(routing)).toBe(false);
        theirs.status = 'completed';
    }
    // An operator's command that finds an automatic request queued creates none: that request stays unmarked.
    const automatic = p.queue();
    expect(p.queue({ operator: true })).toBe(automatic);
    expect('operator' in automatic).toBe(false);
});

test('an operator start-pilot marks the request it queues', () => {
    const start = project({ stage: 'mailbox', activity: 'idle', blocker: '', pilot: false, boardMember: true, type: 'Story' });
    const jira = jiraBinding(start.store.project);
    const { name, id } = jira.statuses.intake[0];
    Object.assign(start.store.ticket(KEY), { assignee: jira.account, status: name, statusId: id });
    const request = start.queue({ operator: true }, 'start-pilot');
    expect(request).toMatchObject({ action: 'start-pilot', operator: true });
    expect(start.requests()).toEqual([request]);
});

test('a ticket at the mailbox, complete, or not a pilot has nothing to resume', () => {
    for (const ticket of [{ stage: 'mailbox' }, { stage: 'complete' }, { pilot: false }]) {
        const p = project(ticket);
        expect(() => p.queue({ repairResume: BINDING }), JSON.stringify(ticket)).toThrow('Ticket has no resumable delivery');
        expect(p.requests()).toEqual([]);
        expect(p.episode()).toBeUndefined();
    }
    // An ordinary resume of a pilot ticket still at the mailbox is as it was: not refused here.
    expect(project({ stage: 'mailbox' }).queue()).toMatchObject({ action: 'resume-ticket' });
});

test('a request already queued or working for the ticket is a refusal for a repair resume, never its answer, and its intake is left alone', () => {
    for (const status of ['queued', 'working'] as const) {
        const p = project();
        const existing = { id: 'existing', key: KEY, action: 'resume-ticket', requestedAt: '2026-11-10T11:00:00.000Z', status, error: '' } as DeliveryRequest;
        p.store.state.deliveryQueue = [existing];
        expect(() => p.queue({ repairResume: BINDING }), status).toThrow('Another delivery request owns this ticket');
        expect(p.requests()).toEqual([existing]);
        expect(existing.repairResume).toBeUndefined();
        expect(p.episode()).toBeUndefined();
        // An ordinary resume is answered with that request, and closes the episode as before.
        expect(p.queue()).toBe(existing);
        expect(p.episode()).toMatchObject({ outcome: 'ordinary-by-start' });
    }
    // One that has ended owns nothing: a new request is queued.
    const p = project();
    p.store.state.deliveryQueue = [{ id: 'done', key: KEY, action: 'resume-ticket', requestedAt: '2026-11-10T11:00:00.000Z', status: 'completed', error: '' } as DeliveryRequest];
    expect(p.queue({ repairResume: BINDING }).id).not.toBe('done');
    expect(p.requests()).toHaveLength(2);
});

test('a repair resume that fails under a closed feature gate ends blocked; an ordinary request is queued again as before', async () => {
    for (const repair of [true, false]) {
        const p = project();
        const request = p.queue(repair ? { repairResume: BINDING } : undefined);
        // The gate closes while the request runs: enrolled, and the plan no longer approved.
        let runs = 0;
        const engine = { store: p.store, busy: false, agents: { active: new Set() }, resume: async () => { runs += 1; p.store.state.features![0].publication.push({ id: 'item-1', key: KEY } as never); throw new Error('Feature requires approval of its current reviewed plan'); } };
        await drainDelivery.call(engine as never);
        expect(runs).toBe(1);
        if (repair) {
            // One read-back per ticket and fix: it is not put back to run again when the gate reopens.
            expect(request).toMatchObject({ status: 'blocked', error: 'Error: Feature requires approval of its current reviewed plan' });
            expect(p.store.state.tickets[0]).toMatchObject({ activity: 'blocked', blocker: request.error });
            await drainDelivery.call(engine as never);
            expect(runs).toBe(1);
        } else {
            expect(request).toMatchObject({ status: 'queued', error: '' });
            await drainDelivery.call(engine as never);
            expect(runs).toBe(2);
        }
    }
});
