import { afterEach, expect, test } from 'vitest';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { deployJournalPath, readDeployJournal, startDeployJournal } from '../../../server/release/deploy-journal';
import { runSteps, stepOf, type StepFunction } from '../../../server/release/run-steps';

const OP = 'deploy-20261120t030000z-0a0b0c0d';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function journal() {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-run-steps-')); roots.push(dataRoot);
    startDeployJournal(dataRoot, OP, ['one', 'two', 'three'], {});
    return { dataRoot, now: () => new Date('2026-11-20T03:00:00.000Z') };
}
const done = (ran: string[], name: string): StepFunction => async () => { ran.push(name); return { state: 'done', receipt: { by: name } }; };

test('steps run in journal order, each intended before it runs, and a later step sees earlier receipts', async () => {
    const ctx = journal(), ran: string[] = [];
    let seen: unknown;
    const outcome = await runSteps(ctx, OP, { one: done(ran, 'one'), two: async receipts => { seen = receipts.one; ran.push('two'); return { state: 'done' }; }, three: done(ran, 'three') });
    expect(outcome).toEqual({ completed: true, receipts: { one: { by: 'one' }, two: {}, three: { by: 'three' } } });
    expect(ran).toEqual(['one', 'two', 'three']);
    expect(seen).toEqual({ by: 'one' });
});

test('a failed or uncertain step ends the run with its reason in the journal, and a rerun runs nothing', async () => {
    for (const state of ['failed', 'uncertain'] as const) {
        const ctx = journal(), ran: string[] = [];
        const steps = { one: done(ran, 'one'), two: async () => ({ state, reason: 'no', receipt: { fenceReleased: true } }), three: done(ran, 'three') };
        expect(await runSteps(ctx, OP, steps)).toEqual({ completed: false, step: 'two', state, reason: 'no', receipt: { fenceReleased: true, reason: 'no' } });
        expect(readDeployJournal(ctx.dataRoot, OP).last).toMatchObject({ step: 'two', state, receipt: { reason: 'no' } });
        expect(await runSteps(ctx, OP, steps)).toMatchObject({ completed: false, step: 'two', state, reason: 'no' });
        expect(ran).toEqual(['one']);
    }
});

test('a step that throws has an unknown outcome', async () => {
    const ctx = journal();
    expect(await runSteps(ctx, OP, { one: async () => { throw new Error('boom'); }, two: done([], 'two'), three: done([], 'three') })).toMatchObject({ completed: false, step: 'one', state: 'uncertain', reason: expect.stringContaining('boom') });
});

test('a run that died mid-step reruns that step without a second intent; one that died after recording goes on to the next', async () => {
    const ctx = journal(), ran: string[] = [];
    const steps = { one: done(ran, 'one'), two: done(ran, 'two'), three: done(ran, 'three') };
    let killAt = 'intended';
    const observe = (event: { step: string; phase: string }) => { if (event.step === 'two' && event.phase === killAt) throw new Error('killed'); };
    await expect(runSteps({ ...ctx, observe }, OP, steps)).rejects.toThrow('killed');
    expect(readDeployJournal(ctx.dataRoot, OP).last).toMatchObject({ step: 'two', state: 'intended' });
    killAt = 'recorded';
    await expect(runSteps({ ...ctx, observe }, OP, steps)).rejects.toThrow('killed');
    expect(await runSteps(ctx, OP, steps)).toMatchObject({ completed: true });
    expect(ran).toEqual(['one', 'two', 'three']);
});

test('a journal that ends in a cut-short line runs nothing', async () => {
    const ctx = journal(), ran: string[] = [];
    appendFileSync(deployJournalPath(ctx.dataRoot, OP), '{"type":"step","operation":"');
    expect(await runSteps(ctx, OP, { one: done(ran, 'one'), two: done(ran, 'two'), three: done(ran, 'three') })).toMatchObject({ completed: false, state: 'uncertain', reason: expect.stringContaining('cut-short') });
    expect(ran).toEqual([]);
});

test('a settled mutation maps to a step: verified is done, rejected failed, uncertain uncertain', () => {
    expect(stepOf({ status: 'verified', receipt: { a: 1 } })).toEqual({ state: 'done', receipt: { a: 1 } });
    expect(stepOf({ status: 'rejected', reason: 'busy' })).toEqual({ state: 'failed', reason: 'busy' });
    expect(stepOf({ status: 'uncertain', reason: 'lost' })).toEqual({ state: 'uncertain', reason: 'lost' });
});
