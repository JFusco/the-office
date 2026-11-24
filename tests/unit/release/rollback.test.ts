import { expect, test } from 'vitest';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { deploy, resumeDeploy } from '../../../server/release/deploy';
import { DEPLOY_STEPS, DeployFacts } from '../../../server/release/deploy-facts';
import { deployJournalPath, readDeployJournal, recordDeployStep } from '../../../server/release/deploy-journal';
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
    expect(journal.receipts.eligibility).toEqual({ basis: 'no admission and no store change beyond a start under the fence since the old service stopped' });
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

test('a deployment that ends before target plist intent rolls back with the service confirmed stopped and no snapshot', async () => {
    const w = make(), facts = await interruptedAt(w, 'backup');
    const { operation, outcome } = await rollback(w.ctx, OP, facts, 'backup failed');
    expect(outcome).toMatchObject({ completed: true });
    expect(readDeployJournal(w.dataRoot, operation).receipts.eligibility).toEqual({ basis: 'the deployment journal ends before target plist intent and the service was confirmed stopped' });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-2', hash: w.hashOf(FROM) });
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a deployment that recorded target plist intent needs the store snapshot, even with none to compare', async () => {
    const w = make(), facts = await interruptedAt(w, 'snapshot');
    recordDeployStep(w.dataRoot, OP, 'snapshot', 'done', {});
    recordDeployStep(w.dataRoot, OP, 'plist', 'intended');
    const { outcome } = await rollback(w.ctx, OP, facts, 'plist uncertain');
    expect(outcome).toMatchObject({ completed: false, step: 'eligibility', state: 'failed', reason: expect.stringContaining('no store snapshot') });
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

/** Rewrites the interrupted deployment's journal with `steps` in its header and `entries` after it. */
function rewriteJournal(w: World, steps: string[], entries: [string, 'intended' | 'done' | 'uncertain'][]) {
    const path = deployJournalPath(w.dataRoot, OP), header = JSON.parse(readFileSync(path, 'utf8').split('\n')[0]);
    writeFileSync(path, `${JSON.stringify({ ...header, steps })}\n`);
    for (const [step, state] of entries) recordDeployStep(w.dataRoot, OP, step, state);
}
const reordered = ['fence', 'idle', 'backup', 'stop', 'snapshot', 'plist', 'start', 'verify', 'record', 'release'];
const withoutPlist = DEPLOY_STEPS.filter(step => step !== 'plist');

test.each<[string, (w: World) => void]>([
    ['the journal has no step entry', w => rewriteJournal(w, DEPLOY_STEPS, [])],
    ['the header runs backup before stop', w => rewriteJournal(w, reordered, [['fence', 'intended'], ['fence', 'done'], ['idle', 'intended'], ['idle', 'done'], ['backup', 'intended']])],
    ['the header has no plist step', w => rewriteJournal(w, withoutPlist, [['fence', 'intended'], ['fence', 'done'], ['idle', 'intended'], ['idle', 'done'], ['stop', 'intended'], ['stop', 'done'], ['backup', 'intended']])],
    ['the header ends at snapshot', w => rewriteJournal(w, DEPLOY_STEPS.slice(0, DEPLOY_STEPS.indexOf('plist')), [['fence', 'intended'], ['fence', 'done'], ['idle', 'intended'], ['idle', 'done'], ['stop', 'intended'], ['stop', 'done'], ['backup', 'intended']])],
    ['the backup ended uncertain', w => rewriteJournal(w, DEPLOY_STEPS, [['fence', 'intended'], ['fence', 'done'], ['idle', 'intended'], ['idle', 'done'], ['stop', 'intended'], ['stop', 'done'], ['backup', 'intended'], ['backup', 'uncertain']])],
    ['the journal ends in a cut-short line', w => appendFileSync(deployJournalPath(w.dataRoot, OP), '{"type":"step","operation":"')],
])('no exemption from the snapshot when %s', async (_, arrange) => {
    const w = make(), facts = await interruptedAt(w, 'backup');
    arrange(w);
    const { outcome } = await rollback(w.ctx, OP, facts, 'backup failed');
    expect(outcome).toMatchObject({ completed: false, step: 'eligibility', state: 'failed', reason: expect.stringContaining('no store snapshot') });
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test('a torn deployment journal before plist is not resumed into a rollback', async () => {
    const w = make();
    await interruptedAt(w, 'backup');
    appendFileSync(deployJournalPath(w.dataRoot, OP), '{"type":"step","operation":"');
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'stopped', reason: expect.stringContaining('cut-short') });
    expect(existsSync(deployJournalPath(w.dataRoot, rollbackOperation(OP)))).toBe(false);
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test.each(['eligibility', 'plist', 'start'])('before plist, a service no longer confirmed stopped refuses rollback %s before its mutation', async step => {
    const w = make(), facts = await interruptedAt(w, 'backup'), rb = rollbackOperation(OP), alive = w.ctx.alive;
    // The service stays unloaded in launchd while a live process owns its lock.
    const owner = () => { writeFileSync(resolve(w.dataRoot, 'service.pid'), '7777\n'); w.ctx.alive = pid => pid === 7777 || alive(pid); };
    const installed = readFileSync(w.plistPath, 'utf8');
    // A changed installed plist makes the restore a fresh dispatch rather than a read-back.
    if (step === 'plist') writeFileSync(w.plistPath, `${installed}\n`);
    w.ctx.observe = event => { if (event.operation === rb && event.step === step && event.phase === 'intended') owner(); };
    const { outcome } = await rollback(w.ctx, OP, facts, 'backup failed');
    expect(outcome).toMatchObject({ completed: false, step, state: 'failed', reason: expect.stringContaining('no longer confirmed stopped for rollback') });
    expect(readFileSync(w.plistPath, 'utf8')).toBe(step === 'plist' ? `${installed}\n` : installed);
    expect(w.calls).toEqual(['acquire', 'bootout']);
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
