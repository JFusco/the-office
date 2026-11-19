import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { newHead } from '../../../fixtures/ci-repair';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { acceptableRefusedQA, requeueRefusedQAResults } from '../../../../server/delivery/recovery/refused-qa-result';
import { finding, refused } from '../support/refused-qa';

const requeue = (f: ReturnType<typeof refused>, revision = 'release-1') => requeueRefusedQAResults(f.store, [f.job], revision);
test('a job the gate refused is queued again once per running revision when its saved QA result now passes', () => {
    const f = refused();
    expect(acceptableRefusedQA(f.store, f.job)).toBe(f.qa);
    expect(requeue(f)).toEqual([f.job.key]);
    expect(f.job).toMatchObject({ status: 'queued', stage: 'validate', qaReaccept: { revision: 'release-1', step: 1 }, qaGateRefusal: { step: 1 } });
    Object.assign(f.job, { status: 'blocked', stop: { kind: 'unclassified', at: '' } });
    expect(requeue(f)).toEqual([]);
    expect(requeue(f, 'release-2')).toEqual([f.job.key]);
});

test('a job whose saved result still fails the gate, or that is not settled, is left exactly as it is', () => {
    for (const [name, change] of [
        ['a finding QA raised itself', (f: any) => { f.qa.findings.push(finding('qa-found', 'open')); }],
        ['a stop that was not the gate refusing the result', (f: any) => { f.job.detail = 'Error: Human delivery inputs changed during this stage; retained result requires reassessment before effects'; }],
        ['human input since the review read it', (f: any) => { f.job.reviewInputSha256 = 'f'.repeat(64); }],
        ['a recorded refusal of an earlier step', (f: any) => { f.job.qaGateRefusal = { step: 0, inputSha256: deliveryInputSha256(f.store, f.job.key), at: '' }; }],
        ['a recorded refusal on inputs that have since changed', (f: any) => { f.job.qaGateRefusal = { step: 1, inputSha256: 'f'.repeat(64), at: '' }; }],
        ['a QA result for another head', (f: any) => { f.job.head = newHead; }],
        ['a QA result that did not pass', (f: any) => { f.qa.outcome = 'failed'; }],
        ['a saved report that is gone', (f: any) => { f.qa.qaRunDir = resolve(f.artifactRoot, 'office-qa', 'missing'); }],
        ['a later step after the QA result', (f: any) => { f.job.steps.push({ stage: 'draft', result: f.qa }); }],
        ['another stage', (f: any) => { f.job.stage = 'review'; }],
        ['a job that is not blocked', (f: any) => { f.job.status = 'working'; }],
        ['a stop another recovery owns', (f: any) => { f.job.stop.kind = 'uncertain-effect'; }],
        ['a parked job', (f: any) => { f.job.parked = { stage: 'validate', reason: '', at: '', published: true }; }],
        ['a continuation with its own gates', (f: any) => { f.job.implementationContinuation = { phase: 'acceptance' }; }],
        ['an unsettled board move', (f: any) => { f.job.boardUpdates = [{ status: 'uncertain' }]; }],
        ['a QA run that did not finish', (f: any) => { delete f.store.state.workLog[0].executionStatus; }],
        ['a claimed job', (f: any) => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'unit', 'validate', 'delivery'); }],
        ['a paused office', (f: any) => { f.store.state.paused = true; }],
    ] as const) {
        const f = refused();
        change(f);
        const before = JSON.stringify(f.job);
        expect(requeue(f), name).toEqual([]);
        expect(JSON.stringify(f.job), name).toBe(before);
    }
});

test('a refusal the gate recorded is trusted over the wording of the stop', () => {
    const f = refused();
    Object.assign(f.job, { detail: 'Error: reworded since', qaGateRefusal: { step: 1, inputSha256: deliveryInputSha256(f.store, f.job.key), at: '' } });
    expect(requeue(f)).toEqual([f.job.key]);
});

test('a refusal from before the gate recorded one is recognised by its wording, whatever the gate says about the result now', () => {
    // The condition that refused it has since been relaxed, so asking the gate again says nothing.
    const f = refused();
    f.job.detail = 'Error: QA criterion references must match the saved acceptance baseline';
    expect(requeue(f)).toEqual([f.job.key]);
});
