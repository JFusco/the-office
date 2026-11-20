import { expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { deploy, resumeDeploy } from '../../../server/release/deploy';
import { DeployFacts } from '../../../server/release/deploy-facts';
import { readDeployJournal } from '../../../server/release/deploy-journal';
import { operationPaths } from '../../../server/release/deploy-paths';
import { readDeployStop } from '../../../server/release/deploy-stop';
import { rollbackOperation } from '../../../server/release/rollback-operation';
import { rollback, ROLLBACK_STEPS } from '../../../server/release/rollback';
import { FROM, PIN, TO, type World } from './deploy-world';
import { make, OP } from './step-fixture';

/** Runs a deployment until its controller dies at `step`, leaving the journal for a rollback to read. */
async function interruptedAt(w: World, step: string, phase: 'intended' | 'recorded' = 'intended') {
    w.ctx.observe = event => { if (event.operation === OP && event.step === step && event.phase === phase) throw new Error('controller killed'); };
    await expect(deploy(w.ctx, { operation: OP, target: TO, controller: PIN })).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    return DeployFacts.parse(readDeployJournal(w.dataRoot, OP).facts);
}

test('a rollback runs its own fixed steps', () => {
    expect(ROLLBACK_STEPS).toEqual(['halt', 'eligibility', 'plist', 'start', 'verify', 'release']);
});

test('after a start with unchanged stores the target is stopped and the previous release restored and verified', async () => {
    const w = make(), prior = readFileSync(w.plistPath, 'utf8'), facts = await interruptedAt(w, 'verify');
    const { operation, outcome } = await rollback(w.ctx, OP, facts, 'the target did not verify');
    expect(outcome).toMatchObject({ completed: true });
    const journal = readDeployJournal(w.dataRoot, operation);
    expect(journal.facts).toEqual({ kind: 'rollback', of: OP, reason: 'the target did not verify', started: true });
    expect(journal.receipts.halt).toMatchObject({ loaded: false, instance: 'instance-2' });
    expect(journal.receipts.eligibility).toEqual({ basis: 'no admission and no store change since the old service stopped' });
    expect(readFileSync(w.plistPath, 'utf8')).toBe(prior);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-3', hash: w.hashOf(FROM) });
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('the stores are compared whenever a snapshot exists, even when the journal says the target never started', async () => {
    const w = make(), facts = await interruptedAt(w, 'plist');
    // The journal stops before `start`, yet something changed a store after the snapshot.
    w.fence.release(readFileSync(`${w.dataRoot}/deployments/${OP}.token`, 'utf8'));
    const { outcome } = await rollback(w.ctx, OP, facts, 'plist uncertain');
    expect(outcome).toMatchObject({ completed: false, step: 'eligibility', state: 'failed', reason: expect.stringContaining('office-control: its contents changed') });
    expect(w.service.loaded).toBe(false);
});

test('a missing baseline blocks rollback even though the target never started', async () => {
    const w = make(), facts = await interruptedAt(w, 'backup');
    const { outcome } = await rollback(w.ctx, OP, facts, 'backup failed');
    expect(outcome).toMatchObject({ completed: false, step: 'eligibility', reason: expect.stringContaining('no store snapshot') });
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.service.loaded).toBe(false);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test.each<[string, (w: World) => void, string]>([
    ['the failed target cannot be stopped', w => { w.behaviour.bootout = 'fail'; }, 'halt'],
    ['launchd refuses to load the previous plist', w => { w.behaviour.bootstrap = 'fail'; }, 'start'],
    ['the restarted service does not hold the fence', w => { w.behaviour.bootstrap = 'unfenced'; }, 'verify'],
    ['the fence cannot be released', w => { w.behaviour.release = 'fail'; }, 'release'],
])('when %s the rollback ends at %s and goes no further', async (_, arrange, step) => {
    const w = make(), facts = await interruptedAt(w, 'verify');
    arrange(w);
    const { operation, outcome } = await rollback(w.ctx, OP, facts, 'the target did not verify');
    expect(outcome).toMatchObject({ completed: false, step });
    expect(readDeployJournal(w.dataRoot, operation).last).toMatchObject({ step });
    if (step !== 'release') expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test.each(['plist', 'start'])('resume at rollback %s rechecks the stopped stores even after eligibility was recorded', async step => {
    const w = make({ bootstrap: 'wrong-hash' }), rb = rollbackOperation(OP);
    w.ctx.observe = event => {
        if (event.operation === rb && event.step === step && event.phase === 'intended') throw new Error('controller killed');
    };
    await expect(deploy(w.ctx, { operation: OP, target: TO, controller: PIN })).rejects.toThrow('controller killed');
    expect(readDeployJournal(w.dataRoot, rb).receipts.eligibility).toBeDefined();
    const installed = readFileSync(w.plistPath, 'utf8'), db = new DatabaseSync(w.projectDb);
    try { db.exec('PRAGMA user_version = 17'); } finally { db.close(); }
    w.ctx.observe = undefined;
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'stopped', step: `${rb}:${step}`, reason: expect.stringContaining('brain: its contents changed') });
    expect(readFileSync(w.plistPath, 'utf8')).toBe(installed);
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout']);
    expect(w.service.loaded).toBe(false);
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP });
});

test('a rollback bootstrap that already landed is reconciled without checking the now-running stores', async () => {
    const w = make({ bootstrap: 'wrong-hash' }), rb = rollbackOperation(OP);
    w.ctx.observe = event => {
        if (event.operation === rb && event.step === 'start' && event.phase === 'intended') w.behaviour.bootstrap = 'writes';
        if (event.operation === rb && event.step === 'start' && event.phase === 'ran') throw new Error('controller killed');
    };
    await expect(deploy(w.ctx, { operation: OP, target: TO, controller: PIN })).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'rolled-back', rollback: rb });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'release']);
});

test('a resumed rollback keeps the facts it started with', async () => {
    const w = make(), facts = await interruptedAt(w, 'verify');
    w.ctx.observe = event => { if (event.step === 'plist' && event.phase === 'intended') throw new Error('controller killed'); };
    await expect(rollback(w.ctx, OP, facts, 'first reason')).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    const { operation, outcome } = await rollback(w.ctx, OP, facts, 'a different reason on resume');
    expect(outcome).toMatchObject({ completed: true });
    expect(readDeployJournal(w.dataRoot, operation).facts).toMatchObject({ reason: 'first reason', started: true });
    expect(w.calls.filter(call => call === 'bootout')).toHaveLength(2);
});
