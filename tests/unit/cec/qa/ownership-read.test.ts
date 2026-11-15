import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { officeCapacity, projectById } from '../../../../server/office/projects';
import { Scheduler } from '../../../../server/scheduling/scheduler';
import { ticket, decision } from '../parking/fixtures';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { continueOwnershipRead } from '../../../../server/cec/qa/continue-ownership-read';
import { scheduledOwnershipRead } from '../../../../server/cec/qa/scheduled-ownership-read';
import { HOLDS } from '../../../../server/office/config';
import { ownershipReadHistory } from '../../../../server/cec/qa/ownership-read-history';
import type { DeliveryRequest } from '../../../../src/shared';

function fixture() {
    const root = realpathSync(mkdtempSync(resolve(tmpdir(), 'qa-ownership-read-'))), repo = resolve(root, 'repo'), candidate = resolve(root, 'candidate');
    mkdirSync(resolve(repo, '.git'), { recursive: true }); mkdirSync(candidate); writeFileSync(resolve(candidate, '.git'), 'retained worktree');
    let now = Date.parse('2026-11-15T12:00:00Z');
    const store = new Store(':memory:', { ...projectById('cec'), repo }, root, { now: () => new Date(now), monotonic: () => now });
    const t = ticket('QA'); Object.assign(t, { stage: 'retest', attempt: 5, activity: 'blocked', prId: 0, branch: 'codex/qa-read-fixture', worktree: candidate, repairAttempts: { F1: 2 } });
    t.approach = { plan: 'reviewed', review: 'focused', validation: 'browser', reason: 'Feature acceptance', checks: ['Feedback preserves prose'] };
    t.results.retest = decision('', { outcome: 'blocked', commit: t.commit, branch: t.branch, worktree: candidate, qaRunDir: resolve(root, 'old-qa'), paidRuns: 0 });
    store.state.tickets = [t];
    const request: DeliveryRequest = { id: '12345678-1234-4234-9234-123456789abc', key: t.key, action: 'resume-ticket',
        status: 'blocked', error: 'Error: Original inventory incomplete', requestedAt: new Date(now).toISOString(),
        officeQAHandoff: { workerId: 'old-qa', commit: t.commit, acknowledgeIncompleteHistory: true, setupNote: 'Preserved signed-in QA environment' } };
    t.blocker = request.error; store.state.deliveryQueue = [request];
    const oldClaim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: request.id }, 'original', 'resume-ticket')!;
    now += 60000; store.finishClaim(oldClaim.id, 'completed');
    const work: any = { id: 'old-read', requestId: request.id, ticket: t.key, role: 'pm', stage: 'readback', status: 'completed', executionStatus: 'completed',
        claimId: oldClaim.id, processId: 23456, sessionId: 'original-reader-session', provider: 'codex', endedAt: new Date(now).toISOString() };
    const qa: any = { id: 'old-qa', ticket: t.key, role: 'qa', stage: 'retest', status: 'blocked', executionStatus: 'completed' };
    store.state.workLog = [qa, work];
    const dir = resolve(root, 'sessions', work.id); mkdirSync(dir, { recursive: true });
    const write = (name: string, value: unknown) => writeFileSync(resolve(dir, name), JSON.stringify(value));
    write('assignment.json', { id: work.id, claimId: work.claimId, lane: 'delivery', work: oldClaim.work, role: 'pm', stage: 'readback', profile: 'reader' });
    write('capabilities.json', { name: 'reader', cutover: 'verified', readOnly: true });
    write('result.json', { provider: work.provider, session: work.sessionId, result: { key: t.key, existingPrId: 0, existingOwner: 'Incomplete inventory', blocker: 'Original inventory incomplete' } });
    write('execution-completion.json', { workerId: work.id, provider: work.provider, session: work.sessionId,
        resultSha256: createHash('sha256').update(readFileSync(resolve(dir, 'result.json'))).digest('hex') });
    now += 60000;
    const view: any = { project: 'cec', key: t.key, complete: true, fresh: true, observedAt: new Date(now).toISOString(), ownership: { status: 'clear' } };
    const execute = vi.fn(async (_: string, args: string[], options: any) => {
        if (args[0] === 'rev-parse') return args.at(-1) === 'HEAD' ? t.commit : resolve(repo, '.git');
        if (args[0] === 'remote') return 'https://example.test/repository';
        if (args[0] === 'symbolic-ref') return `refs/heads/${t.branch}`;
        if (args[0] === 'status') return '';
        if (args[0] === 'worktree') return `worktree ${candidate}\nHEAD ${t.commit}\nbranch refs/heads/${t.branch}\n`;
        throw new Error(`Unexpected read ${args} ${options.cwd}`);
    });
    const engine: any = { busy: false, agents: { active: new Set() } };
    const project = () => scheduledOwnershipRead(store, engine, request, () => view);
    const run = async (alive = () => false) => {
        const claim = store.claimWork({ projectId: 'cec', kind: 'delivery', id: request.id }, 'new', 'check-qa-ownership')!;
        return withAssignment(claim, 'delivery', () => continueOwnershipRead(store, request, () => view, execute as any, alive));
    };
    return { root, store, t, request, qa, work, oldClaim, view, dir, write, execute, engine, project, run,
        close() { delete HOLDS[t.key]; store.close(); rmSync(root, { recursive: true, force: true }); } };
}

test('one durable same-request read retains the original blocked decision, result, counters and native evidence', async () => {
    const f = fixture(); try {
        const before = structuredClone(f.request), ticketBefore = structuredClone(f.t), old = readFileSync(resolve(f.dir, 'result.json'));
        f.execute.mockImplementationOnce(async () => {
            expect(f.request.qaReadContinuation?.phase).toBe('checking'); expect(f.request.status).toBe('blocked');
            expect(f.request.officeQAHandoff?.consumedAt).toBeUndefined(); return resolve(f.root, 'repo', '.git');
        });
        const item = f.project()!; expect(item.stage).toBe('check-qa-ownership'); expect(item.saveTiming).toBeUndefined(); expect(item.timing).toBeUndefined();
        expect(ownershipReadHistory(f.store, f.request, () => false).workerId).toBe('old-read');
        await f.run();
        expect(f.request.status, f.request.qaReadContinuation?.error).toBe('queued'); expect(f.store.state.deliveryQueue).toHaveLength(1);
        expect(f.request.qaReadContinuation).toMatchObject({ phase: 'queued', originalRequest: before, originalReader: { workerId: 'old-read' } });
        expect(f.t).toEqual(ticketBefore); expect(f.request.officeQAHandoff?.consumedAt).toBeUndefined();
        expect(readFileSync(resolve(f.dir, 'result.json'))).toEqual(old);
        expect(f.execute.mock.calls.every(c => c[0] === 'git' && c[2].readOnly)).toBe(true);
        // A second blocked PM observation is retained; it cannot cause another automatic continuation.
        f.request.status = 'blocked'; expect(f.project()).toBeUndefined();
        await expect(f.run()).rejects.toThrow();
    } finally { f.close(); }
});

test.each(['stale', 'unknown', 'wrong-project', 'old-observation', 'future-observation', 'consumed', 'paused', 'draining', 'hold', 'unknown-usage', 'accepted-qa', 'competing-request', 'active-worker', 'changed-head', 'pr', 'feature-paused'])('does not schedule %s', reason => {
    const f = fixture(); try {
        if (reason === 'stale') f.view.fresh = false;
        if (reason === 'unknown') f.view.ownership.status = 'unknown';
        if (reason === 'wrong-project') f.view.project = 'other';
        if (reason === 'old-observation') f.view.observedAt = f.work.endedAt;
        if (reason === 'future-observation') f.view.observedAt = '2027-01-01T00:00:00Z';
        if (reason === 'consumed') f.request.officeQAHandoff!.consumedAt = 'already';
        if (reason === 'paused') f.store.state.paused = true;
        if (reason === 'draining') f.store.state.draining = true;
        if (reason === 'hold') HOLDS[f.t.key] = 'Retain hold';
        if (reason === 'unknown-usage') f.t.results.retest!.paidRuns = null;
        if (reason === 'accepted-qa') f.t.results.retest!.qa = {} as any;
        if (reason === 'competing-request') f.store.state.deliveryQueue!.push({ ...f.request, id: 'other', status: 'queued' });
        if (reason === 'active-worker') f.work.status = 'running';
        if (reason === 'changed-head') f.request.officeQAHandoff!.commit = 'b'.repeat(40);
        if (reason === 'pr') f.t.prId = 123;
        if (reason === 'feature-paused') f.t.pilot = false;
        expect(f.project()).toBeUndefined(); expect(f.request.qaReadContinuation).toBeUndefined();
    } finally { f.close(); }
});

test.each(['live-group', 'missing-result', 'wrong-result', 'wrong-completion', 'writer-profile', 'wrong-claim', 'dirty', 'git-head', 'racing-artifact', 'racing-hold', 'racing-ownership'])('consumes a failed guard once and preserves history for %s', async reason => {
    const f = fixture(); try {
        const before = structuredClone(f.request), counters = f.t.attempt;
        if (reason === 'missing-result') rmSync(resolve(f.dir, 'result.json'));
        if (reason === 'wrong-result') f.write('result.json', { result: { key: 'CEC-999' } });
        if (reason === 'wrong-completion') f.write('execution-completion.json', {});
        if (reason === 'writer-profile') f.write('capabilities.json', { name: 'reader', readOnly: false, cutover: 'verified' });
        if (reason === 'wrong-claim') f.store.db.prepare('UPDATE work_claims SET body=? WHERE id=?').run(JSON.stringify({ ...f.oldClaim, status: 'active' }), f.oldClaim.id);
        const original = f.execute.getMockImplementation()!;
        f.execute.mockImplementation(async (...args) => {
            if (reason === 'dirty' && args[1][0] === 'status') return ' M source.ts';
            if (reason === 'git-head' && args[1][0] === 'rev-parse' && args[1].at(-1) === 'HEAD') return 'b'.repeat(40);
            if (reason === 'racing-artifact') f.write('result.json', {});
            if (reason === 'racing-hold') HOLDS[f.t.key] = 'New hold';
            if (reason === 'racing-ownership') f.view.complete = false;
            return original(...args);
        });
        await f.run(() => reason === 'live-group');
        expect(f.request.status).toBe('blocked'); expect(f.request.error).toBe(before.error);
        expect(f.request.qaReadContinuation).toMatchObject({ phase: 'blocked', originalRequest: before });
        expect(f.request.officeQAHandoff?.consumedAt).toBeUndefined(); expect(f.t.attempt).toBe(counters); expect(f.project()).toBeUndefined();
    } finally { f.close(); }
});

test('the real scheduler claims one exclusive deterministic check and restores busy without mutating original timing', async () => {
    const f = fixture(); try {
        const timing = [{ stage: 'resume-ticket', claimedAt: 'original' }]; Object.assign(f.request, { timing });
        const original = structuredClone(f.request), workBefore = structuredClone(f.store.state.workLog);
        let release!: () => void;
        const waiting = new Promise<void>(done => { release = done; });
        const run: typeof continueOwnershipRead = async (store, request, view) => {
            expect(f.engine.busy).toBe(true);
            await waiting;
            return continueOwnershipRead(store, request, view, f.execute as any, () => false);
        };
        const item = scheduledOwnershipRead(f.store, f.engine, f.request, () => f.view, run)!;
        expect(item.slot).toBeUndefined(); expect(f.execute).not.toHaveBeenCalled();
        const scheduler = new Scheduler(officeCapacity(), f.store.clock);
        const running = scheduler.pump([{ store: f.store, items: [item] }]);
        expect(f.engine.busy).toBe(true); expect(f.store.activeClaims()).toHaveLength(1);
        await scheduler.pump([{ store: f.store, items: [item] }]);
        expect(f.store.activeClaims()).toHaveLength(1);
        release(); await running;
        expect(f.engine.busy).toBe(false); expect(f.store.activeClaims()).toHaveLength(0);
        expect(f.request.status).toBe('queued'); expect(f.request.qaReadContinuation?.originalRequest).toEqual(original);
        expect((f.request as any).timing).toEqual(timing); expect(f.store.state.workLog).toEqual(workBefore);
        expect(f.store.db.prepare('SELECT * FROM queue_timings').all()).toHaveLength(1);
        expect(f.project()).toBeUndefined();
    } finally { f.close(); }
});
