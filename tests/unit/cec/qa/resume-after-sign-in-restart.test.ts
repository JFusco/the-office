import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { resumeAfterSignIn } from '../../../../server/cec/qa/resume-after-sign-in';
import { SIGN_IN_WAIT_FILE } from '../../../../server/qa/sign-in-wait';
import { HOLDS } from '../../../../server/office/config';
import { Engine } from '../../../../server/scheduling/engine';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { ticket } from '../parking/fixtures';
import type { StageResult, Ticket } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => { try { s.close(); } catch { /* closed */ } }); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); delete HOLDS['CEC-900']; });
const HEAD = 'a'.repeat(40), KEY = 'CEC-900', RECORD = { port: 58321, signInUrl: 'https://login.example.test/authorize', appUrl: 'https://app.example.test/' };
const SIGNED_IN = async () => [{ url: 'https://app.example.test/projects' }];

/** A ticket blocked at staging QA on a sign-in wait, in a store on disk. */
function waiting() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-sign-in-restart-')); roots.push(root);
    const dataRoot = resolve(root, 'data'), path = resolve(root, 'office.sqlite');
    const store = open(path, dataRoot);
    const t: Ticket = { ...ticket('Ready for Staging'), stage: 'staging-qa', activity: 'blocked', blocker: 'Joe completes sign-in', pilot: true };
    const qaRunDir = resolve(dataRoot, 'runs', t.runId, 'office-qa', 'staging-qa-1'); mkdirSync(qaRunDir, { recursive: true });
    writeFileSync(resolve(qaRunDir, SIGN_IN_WAIT_FILE), JSON.stringify(RECORD));
    t.results['staging-qa'] = { outcome: 'blocked', summary: 'Sign-in needed', blocker: 'Joe completes sign-in', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 9, qaRunDir, paidRuns: 0,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [], release: null },
        qa: { setup: { status: 'blocked' }, cases: [{ status: 'not-tested' }] } } as unknown as StageResult;
    store.state.tickets = [t];
    store.save();
    /** What a process that died now leaves on disk (its last commit, read through another connection), opened and recovered by the next one. */
    const crash = (name: string) => {
        const copy = resolve(root, `${name}.sqlite`), reader = new DatabaseSync(path);
        try { reader.exec(`VACUUM INTO '${copy}'`); } finally { reader.close(); }
        const restarted = open(copy, dataRoot);
        restarted.recover();
        return restarted;
    };
    return { store, t, qaRunDir, crash };
}
function open(path: string, dataRoot: string) { const store = new Store(path, projectById('cec'), dataRoot); stores.push(store); return store; }
/** The Office's own queue admission, as the provider observation passes it. */
const admit = (store: Store) => { const engine = new Engine(store); return (key: string) => engine.requestDelivery(key, 'resume-ticket'); };
const resumes = (store: Store) => (store.state.deliveryQueue || []).filter(request => request.key === KEY && request.action === 'resume-ticket' && request.status === 'queued');
const asks = (store: Store) => store.state.outbox.some(item => JSON.stringify(item).includes(KEY));

test('a restart before the resume is queued leaves the wait open, and the next observation queues one resume', async () => {
    const f = waiting();
    let restarted: Store | undefined;
    await resumeAfterSignIn(f.store, () => { restarted = f.crash('before-commit'); throw new Error('process died'); }, SIGNED_IN);
    const after = restarted!;
    expect(after.ticket(KEY).signInResumedFor).toBeUndefined();
    expect([resumes(after).length, asks(after)]).toEqual([0, true]);
    expect(await resumeAfterSignIn(after, admit(after), SIGNED_IN)).toEqual([KEY]);
    expect(resumes(after)).toHaveLength(1);
    // Queuing the resume is not the sign-in: the ticket still asks until QA checks the signed-in account and tenant.
    expect([after.ticket(KEY).activity, asks(after)]).toEqual(['blocked', true]);
});

test('a restart after the resume is queued, and repeated observations, leave exactly one resume', async () => {
    const f = waiting();
    expect(await resumeAfterSignIn(f.store, admit(f.store), SIGNED_IN)).toEqual([KEY]);
    const after = f.crash('after-commit');
    expect(after.ticket(KEY).signInResumedFor).toBe(f.qaRunDir);
    for (const store of [after, after, f.store]) expect(await resumeAfterSignIn(store, admit(store), SIGNED_IN)).toEqual([]);
    expect([resumes(after).length, resumes(f.store).length]).toEqual([1, 1]);
});

test.each<[string, (f: ReturnType<typeof waiting>) => void, number]>([
    ['the Office is paused', f => { f.store.state.paused = true; }, 0],
    ['the Office is draining', f => { f.store.state.draining = true; }, 0],
    ['the ticket is held', () => { HOLDS[KEY] = 'Held for the test'; }, 0],
    ['the ticket was resumed by hand', f => { f.t.activity = 'working'; }, 0],
    ['the candidate moved', f => { f.t.commit = 'b'.repeat(40); }, 0],
    ['another request was queued', f => { admit(f.store)(KEY); }, 1],
])('nothing stale is queued or marked when, during the browser read, %s', async (_name, change, queued) => {
    const f = waiting();
    expect(await resumeAfterSignIn(f.store, admit(f.store), async () => { change(f); return SIGNED_IN(); })).toEqual([]);
    expect(f.t.signInResumedFor).toBeUndefined();
    expect(resumes(f.store)).toHaveLength(queued);
    expect(f.store.state.events.some(event => event.kind === 'qa-sign-in-observed')).toBe(false);
});

test('a resume the queue refuses is recorded on disk with its marker, and not asked for again', async () => {
    const f = waiting();
    let calls = 0;
    const refuse = () => { calls++; throw new Error('Ticket has no resumable delivery'); };
    expect(await resumeAfterSignIn(f.store, refuse, SIGNED_IN)).toEqual([]);
    const after = f.crash('after-refusal');
    expect(after.ticket(KEY).signInResumedFor).toBe(f.qaRunDir);
    expect(after.state.events.some(event => event.kind === 'qa-sign-in-resume-refused')).toBe(true);
    expect(await resumeAfterSignIn(after, refuse, SIGNED_IN)).toEqual([]);
    expect(calls).toBe(1);
});
