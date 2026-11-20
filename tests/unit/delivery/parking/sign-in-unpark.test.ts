import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { park } from '../../../../server/delivery/parking/park';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import { unparkSignedIn } from '../../../../server/delivery/parking/sign-in-unpark';
import { SIGN_IN_WAIT_FILE } from '../../../../server/qa/sign-in-wait';
import { HOLDS } from '../../../../server/office/config';
import type { StageResult } from '../../../../src/shared';
afterEach(() => { cleanupFakes(); delete HOLDS['GH-5']; });

const pickup = { enabled: true, status: 'Ready' };
const RECORD = { port: 58321, signInUrl: 'https://login.example.test/authorize', appUrl: 'http://127.0.0.1:3000/' };
const SIGNED_IN = async () => [{ url: 'http://127.0.0.1:3000/projects' }], WAITING = async () => [{ url: 'https://login.example.test/authorize' }];

/** A job parked at validate on a QA sign-in wait whose run left a record. */
async function parked(record: unknown = RECORD, change: (result: StageResult) => void = () => undefined) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'validate', status: 'working' });
    f.state.cards[0].status = 'progress';
    const qaRunDir = resolve(f.store.dataRoot, 'ticket-work', job.id, 'office-qa', 'validate-1'); mkdirSync(qaRunDir, { recursive: true });
    if (record) writeFileSync(resolve(qaRunDir, SIGN_IN_WAIT_FILE), JSON.stringify(record));
    const result = { outcome: 'blocked', summary: 'Sign-in needed', blocker: 'Joe completes sign-in in the open window.', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir, paidRuns: 0, prerequisites: null,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [], release: null }, qa: { setup: { status: 'blocked' }, cases: [{ status: 'not-tested' }] } } as unknown as StageResult;
    change(result);
    job.steps.push({ stage: 'validate', result });
    await claimedDelivery(f.store, job, () => park(f.delivery, job, result));
    return { f, job, execute: f.execute as any };
}

test('sign-in observed returns the card to Ready with one comment, the job resumes at validate, and it happens once', async () => {
    const { f, job, execute } = await parked();
    expect(f.state.cards[0].status).toBe('block');
    const comments = f.state.comments.length, ports: number[] = [];
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, async port => { ports.push(port); return SIGNED_IN(); })).toEqual(['GH-5']);
    expect(ports).toEqual([58321]);
    expect(f.state.cards[0].status).toBe('ready');
    expect(f.state.comments).toHaveLength(comments + 1);
    expect(f.state.comments.at(-1).body).toContain('The browser QA left open for sign-in is now in the application');
    expect(job.signInUnparkedStep).toBe(job.steps.length - 1);
    // A person who puts the card back in Block keeps it there.
    f.state.cards[0].status = 'block';
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, SIGNED_IN)).toEqual([]);
    expect(f.state.cards[0].status).toBe('block');
    f.state.cards[0].status = 'ready';
    expect(resumeParked(f.store, f.delivery.jobs, [{ key: 'GH-5', pickupStatus: 'Ready' }] as any, pickup, new Map([[f.store.project.id, f.store]]), new Date())).toEqual(['GH-5']);
    expect(job).toMatchObject({ status: 'queued', stage: 'validate' });
});

test.each<[string, unknown, () => Promise<{ url: string }[] | null>]>([
    ['the sign-in is not done', RECORD, WAITING],
    ['the browser is gone', RECORD, async () => null],
    ['there is no record', null, SIGNED_IN],
    ['the record is malformed', { port: 1 }, SIGNED_IN],
])('the card stays in Block with no comment, and the wait stays open, when %s', async (_name, record, pages) => {
    const { f, job, execute } = await parked(record);
    const comments = f.state.comments.length;
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, pages)).toEqual([]);
    expect([f.state.cards[0].status, f.state.comments.length]).toEqual(['block', comments]);
    expect(job.signInUnparkedStep).toBeUndefined();
});

test.each<[string, (result: StageResult) => void]>([
    ['the park is a human decision', result => { result.resolution!.kind = 'human-hold'; }],
    ['the park is a release wait', result => { result.resolution!.release = { registry: 'npm', package: 'x', minimum: '1.0.0' }; }],
    ['the stop is for another head', result => { result.commit = 'b'.repeat(40); }],
    ['the run made a paid call', result => { result.paidRuns = 1; }],
])('the browser is not read when %s', async (_name, change) => {
    const { f, execute } = await parked(RECORD, change);
    let reads = 0;
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, async () => { reads++; return SIGNED_IN(); })).toEqual([]);
    expect([reads, f.state.cards[0].status]).toEqual([0, 'block']);
});

test('a hold, a pause or disabled pickup leaves the card alone', async () => {
    const { f, execute } = await parked();
    HOLDS['GH-5'] = 'Held for the test';
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, SIGNED_IN)).toEqual([]);
    delete HOLDS['GH-5'];
    f.store.state.paused = true;
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, SIGNED_IN)).toEqual([]);
    f.store.state.paused = false;
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, { enabled: false, status: 'Ready' }, SIGNED_IN)).toEqual([]);
    expect(f.state.cards[0].status).toBe('block');
});

test('a card a person already moved out of Block is not moved, and is not tried again', async () => {
    const { f, job, execute } = await parked();
    f.state.cards[0].status = 'progress';
    const comments = f.state.comments.length;
    expect(await unparkSignedIn(f.store, execute, f.delivery.jobs, pickup, SIGNED_IN)).toEqual([]);
    expect([f.state.cards[0].status, f.state.comments.length]).toEqual(['progress', comments]);
    expect(job.signInUnparkedStep).toBe(job.steps.length - 1);
});
