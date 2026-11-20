import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { resumeAfterSignIn } from '../../../../server/cec/qa/resume-after-sign-in';
import { SIGN_IN_WAIT_FILE } from '../../../../server/qa/sign-in-wait';
import { HOLDS } from '../../../../server/office/config';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { ticket } from '../parking/fixtures';
import type { StageResult, Ticket } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); delete HOLDS['CEC-900']; });
const HEAD = 'a'.repeat(40), RECORD = { port: 58321, signInUrl: 'https://login.example.test/authorize', appUrl: 'https://app.example.test/' };
const SIGNED_IN = async () => [{ url: 'https://app.example.test/projects' }], WAITING = async () => [{ url: 'https://login.example.test/authorize' }];

/** A ticket blocked at staging QA on a sign-in wait whose run left a record. */
function waiting(record: unknown = RECORD) {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-sign-in-resume-')); roots.push(dataRoot);
    const store = new Store(':memory:', projectById('cec'), dataRoot); stores.push(store);
    const t: Ticket = { ...ticket('Ready for Staging'), stage: 'staging-qa', activity: 'blocked', blocker: 'Joe completes sign-in', pilot: true };
    const qaRunDir = resolve(dataRoot, 'runs', t.runId, 'office-qa', 'staging-qa-1'); mkdirSync(qaRunDir, { recursive: true });
    if (record) writeFileSync(resolve(qaRunDir, SIGN_IN_WAIT_FILE), JSON.stringify(record));
    t.results['staging-qa'] = { outcome: 'blocked', summary: 'Sign-in needed', blocker: 'Joe completes sign-in', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 9, qaRunDir, paidRuns: 0,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [], release: null },
        qa: { setup: { status: 'blocked' }, cases: [{ status: 'not-tested' }] } } as unknown as StageResult;
    store.state.tickets = [t];
    const requested: string[] = [];
    return { store, t, requested, resume: (key: string) => { requested.push(key); } };
}

test('requests one resume once the waiting browser is in the application, and never a second for the same wait', async () => {
    const { store, t, requested, resume } = waiting();
    const ports: number[] = [];
    expect(await resumeAfterSignIn(store, resume, async port => { ports.push(port); return SIGNED_IN(); })).toEqual(['CEC-900']);
    expect([requested, ports]).toEqual([['CEC-900'], [58321]]);
    expect(t.signInResumedFor).toBe(t.results['staging-qa']!.qaRunDir);
    expect(await resumeAfterSignIn(store, resume, SIGNED_IN)).toEqual([]);
    expect(requested).toHaveLength(1);
});

test('a later wait from another run is resumed in its own right', async () => {
    const { store, t, requested, resume } = waiting();
    await resumeAfterSignIn(store, resume, SIGNED_IN);
    const next = resolve(store.dataRoot, 'runs', t.runId, 'office-qa', 'staging-qa-2'); mkdirSync(next, { recursive: true });
    writeFileSync(resolve(next, SIGN_IN_WAIT_FILE), JSON.stringify(RECORD));
    t.results['staging-qa']!.qaRunDir = next;
    expect(await resumeAfterSignIn(store, resume, SIGNED_IN)).toEqual(['CEC-900']);
    expect(requested).toHaveLength(2);
});

test.each<[string, (f: ReturnType<typeof waiting>) => void]>([
    ['the Office is paused', f => { f.store.state.paused = true; }],
    ['the ticket is held', () => { HOLDS['CEC-900'] = 'Held for the test'; }],
    ['the ticket is not blocked', f => { f.t.activity = 'working'; }],
    ['the candidate moved', f => { f.t.commit = 'b'.repeat(40); }],
    ['the stop is a decision, not an environment wait', f => { f.t.results['staging-qa']!.resolution!.kind = 'human-hold'; }],
    ['the run made a paid call', f => { f.t.results['staging-qa']!.paidRuns = 1; }],
    ['a request is already queued', f => { f.store.state.deliveryQueue = [{ id: 'r', key: 'CEC-900', action: 'resume-ticket', requestedAt: '', status: 'queued', error: '' } as any]; }],
])('nothing is requested and the browser is not read when %s', async (_name, change) => {
    const f = waiting(); change(f);
    let reads = 0;
    expect(await resumeAfterSignIn(f.store, f.resume, async () => { reads++; return SIGNED_IN(); })).toEqual([]);
    expect([f.requested, reads]).toEqual([[], 0]);
});

test.each<[string, unknown, () => Promise<{ url: string }[] | null>]>([
    ['there is no record', null, SIGNED_IN],
    ['the record is malformed', { port: 'x' }, SIGNED_IN],
    ['the sign-in is not done', RECORD, WAITING],
    ['the browser is gone', RECORD, async () => null],
])('nothing is requested, and the wait stays open, when %s', async (_name, record, pages) => {
    const f = waiting(record);
    expect(await resumeAfterSignIn(f.store, f.resume, pages)).toEqual([]);
    expect(f.requested).toEqual([]);
    expect(f.t.signInResumedFor).toBeUndefined();
});

test('a refused resume is recorded and not asked for again', async () => {
    const { store, t } = waiting();
    let calls = 0;
    const refuse = () => { calls++; throw new Error('Ticket has no resumable delivery'); };
    expect(await resumeAfterSignIn(store, refuse, SIGNED_IN)).toEqual([]);
    expect(await resumeAfterSignIn(store, refuse, SIGNED_IN)).toEqual([]);
    expect(calls).toBe(1);
    expect(t.signInResumedFor).toBeTruthy();
});
