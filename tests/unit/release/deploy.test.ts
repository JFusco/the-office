import { afterEach, expect, test } from 'vitest';
import { appendFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { deploy, resumeDeploy, DEPLOY_STEPS } from '../../../server/release/deploy';
import { readOutcome } from '../../../server/release/deploy-outcome';
import { endHeldDeployment } from '../../../server/release/end-held-deployment';
import { deployJournalPath, readDeployJournal } from '../../../server/release/deploy-journal';
import { deployLockPath } from '../../../server/release/deploy-lock';
import { deployPaths, operationPaths } from '../../../server/release/deploy-paths';
import { readDeployStop, writeDeployStop } from '../../../server/release/deploy-stop';
import { readActiveRelease } from '../../../server/release/record-active';
import { releaseDirectory, releasePaths } from '../../../server/release/release-paths';
import { rollbackOperation } from '../../../server/release/rollback-operation';
import { FROM, PIN, TO, world, type Behaviour, type World } from './deploy-world';

const OP = 'deploy-20261120t030000z-0a0b0c0d';
const worlds: World[] = [];
afterEach(() => worlds.splice(0).forEach(w => w.close()));
const make = (behaviour: Behaviour = {}) => { const w = world(behaviour); worlds.push(w); return w; };
const run = (w: World, target = TO) => deploy(w.ctx, { operation: OP, target, controller: PIN });
const count = (w: World, call: string) => w.calls.filter(name => name === call).length;

test('a deployment fences, stops, backs up, starts the target, verifies it, records it and releases the fence', async () => {
    const w = make(), outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'deployed', operation: OP });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(w.plist().WorkingDirectory).toBe(releaseDirectory(w.dataRoot, TO));
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-2', hash: w.hashOf(TO) });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(readActiveRelease(w.dataRoot)).toMatchObject({ commit: TO, previous: FROM, operation: OP, serviceInstanceId: 'instance-2', hash: w.hashOf(TO) });
    const journal = readDeployJournal(w.dataRoot, OP);
    expect(journal.last).toMatchObject({ step: 'release', state: 'done' });
    expect(Object.keys(journal.receipts)).toEqual(DEPLOY_STEPS);
    expect(journal.facts).toMatchObject({ controller: PIN, source: { commit: FROM, serviceInstanceId: 'instance-1' }, target: { commit: TO } });
    expect(existsSync(resolve(releasePaths(w.dataRoot).backups, OP, 'inventory.json'))).toBe(true);
    // The token never reaches the journal, and is gone once the fence is released.
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(false);
    expect(readFileSync(resolve(w.dataRoot, 'deployments', `${OP}.jsonl`), 'utf8')).not.toMatch(/"token"/);
    expect(existsSync(deployLockPath(w.dataRoot))).toBe(false);
    expect(readDeployStop(w.dataRoot)).toBeNull();
    expect(readOutcome(w.dataRoot, OP)).toEqual(outcome);
});

test.each<[string, (w: World) => void, RegExp]>([
    ['the target is not built', () => {}, /not built/],
    ['the target no longer matches its manifest', w => writeFileSync(resolve(releaseDirectory(w.dataRoot, TO), 'server/index.ts'), 'changed\n'), /mismatch/],
    ['the running release files changed after startup', w => writeFileSync(resolve(releaseDirectory(w.dataRoot, FROM), 'server/index.ts'), 'changed\n'), /restart it before deploying/],
    ['the target is the running release', () => {}, /already the one the service runs/],
    ['another deployment holds the fence', w => { w.fence.acquire('another-token-0123456789', 'deploy-other'); }, /held by deploy-other/],
    ['the service runs from a checkout', w => writeFileSync(w.plistPath, JSON.stringify({ ...w.plist(), WorkingDirectory: w.root })), /does not run a release/],
    ['a STOP record stands', w => { writeDeployStop(w.dataRoot, { operation: 'deploy-earlier-00000000', step: 'stop', reason: 'earlier', instruction: 'look' }); }, /stopped for a person/],
    ['another deployment holds the lock', w => writeFileSync(deployLockPath(w.dataRoot), JSON.stringify({ pid: process.pid, operation: 'deploy-live-00000000', at: '2026-11-20T02:59:00.000Z' })), /holds the deploy lock/],
])('nothing is changed when %s', async (name, arrange, reason) => {
    const w = make();
    arrange(w);
    const plist = readFileSync(w.plistPath, 'utf8'), fence = w.fence.read();
    const outcome = await run(w, name === 'the target is not built' ? 'd'.repeat(40) : name === 'the target is the running release' ? FROM : TO);
    expect(outcome).toMatchObject({ status: 'refused', step: null });
    expect(outcome.reason).toMatch(reason);
    expect(w.calls).toEqual([]);
    expect(readFileSync(w.plistPath, 'utf8')).toBe(plist);
    expect(w.fence.read()).toEqual(fence);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-1' });
});

test('a matching running release is accepted without a source manifest', async () => {
    const w = make();
    rmSync(resolve(releaseDirectory(w.dataRoot, FROM), 'release.json'));
    expect(await run(w)).toMatchObject({ status: 'deployed' });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
});

test('a plist replaced during the planning health read is preserved and no fence is acquired', async () => {
    const w = make(), health = w.ctx.office.health;
    const replacement = readFileSync(w.plistPath, 'utf8').replaceAll(FROM, PIN);
    w.ctx.office.health = async () => {
        const answer = await health();
        writeFileSync(w.plistPath, replacement);
        return answer;
    };
    expect(await run(w)).toMatchObject({ status: 'refused', step: null, reason: expect.stringContaining('plist changed during deployment planning') });
    expect(readFileSync(w.plistPath, 'utf8')).toBe(replacement);
    expect(w.calls).toEqual([]);
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a service that reports no fence is refused: it is replaced by hand', async () => {
    const w = make(), health = w.ctx.office.health;
    w.ctx.office.health = async () => { const { fence: _, ...legacy } = await health() as Record<string, unknown>; return legacy; };
    expect(await run(w)).toMatchObject({ status: 'refused', reason: expect.stringContaining('replaced by hand') });
    expect(w.calls).toEqual([]);
});

test('a service that stays busy under the fence is left running and the fence is released', async () => {
    const w = make({ busy: true });
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'aborted', step: 'idle', reason: expect.stringContaining('timeout') });
    expect(w.clock.ms - Date.parse('2026-11-20T03:00:00.000Z')).toBeGreaterThanOrEqual(w.ctx.timings.idleDeadlineMs - w.ctx.timings.idleIntervalMs);
    expect(w.calls).toEqual(['acquire', 'release']);
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-1' });
    expect(w.plist().WorkingDirectory).toBe(releaseDirectory(w.dataRoot, FROM));
    expect(readDeployStop(w.dataRoot)).toBeNull();
});

test('a target that never answers is stopped and the previous release restored when the stores are unchanged', async () => {
    const w = make({ bootstrap: 'silent' }), prior = readFileSync(w.plistPath, 'utf8');
    w.ctx.observe = event => { if (event.operation !== OP && event.step === 'start' && event.phase === 'intended') w.behaviour.bootstrap = undefined; };
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'rolled-back', step: 'verify', rollback: rollbackOperation(OP) });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'release']);
    expect(readFileSync(w.plistPath, 'utf8')).toBe(prior);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-3', hash: w.hashOf(FROM) });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(readActiveRelease(w.dataRoot)).toBeNull();
    expect(readDeployJournal(w.dataRoot, OP).last).toMatchObject({ step: 'verify', state: 'failed' });
    expect(readDeployJournal(w.dataRoot, rollbackOperation(OP))).toMatchObject({ facts: { kind: 'rollback', of: OP, started: true }, last: { step: 'release', state: 'done' } });
    expect(readDeployStop(w.dataRoot)).toBeNull();
});

test.each<[NonNullable<Behaviour['bootstrap']>, RegExp]>([
    ['writes', /brain: its contents changed/],
    ['admits', /brain: the cursor moved from 1 to 2/],
])('a failed target that %s is not rolled back: the service stays stopped and fenced for a person', async (mode, reason) => {
    const w = make({ bootstrap: mode }), health = w.ctx.office.health;
    // The target starts and changes a store, then fails verification.
    w.ctx.office.health = async () => { const answer = await health() as Record<string, unknown>; return answer.serviceInstanceId === 'instance-1' ? answer : { ...answer, loadedHash: 'e'.repeat(64) }; };
    const backup = resolve(releasePaths(w.dataRoot).backups, OP);
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'stopped', step: `${rollbackOperation(OP)}:eligibility` });
    expect(outcome.reason).toMatch(reason);
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout']);
    expect(w.service.loaded).toBe(false);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    // The target's plist is left in place and no backup was read back into a store.
    expect(w.plist().WorkingDirectory).toBe(releaseDirectory(w.dataRoot, TO));
    expect(readdirSync(backup).sort()).toEqual(['brain.sqlite', 'inventory.json', 'office-control.sqlite']);
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, step: `${rollbackOperation(OP)}:eligibility`, instruction: expect.stringContaining(`deploy end ${OP}`) });
    expect(existsSync(deployLockPath(w.dataRoot))).toBe(false);
});

test.each<[NonNullable<Behaviour['bootstrap']>, string]>([['wrong-hash', 'verify'], ['unfenced', 'verify'], ['fail', 'start']])('a target whose start is %s rolls back from step %s', async (mode, step) => {
    const w = make({ bootstrap: mode });
    w.ctx.observe = event => { if (event.operation !== OP && event.step === 'start' && event.phase === 'intended') w.behaviour.bootstrap = undefined; };
    expect(await run(w)).toMatchObject({ status: 'rolled-back', step });
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(FROM) });
    expect(w.plist().WorkingDirectory).toBe(releaseDirectory(w.dataRoot, FROM));
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a stop that launchd reports failed but read-back confirms is settled without a second stop', async () => {
    const w = make({ bootout: 'lost' });
    expect(await run(w)).toMatchObject({ status: 'deployed' });
    expect(count(w, 'bootout')).toBe(1);
});

test('a stop that read-back cannot confirm ends in STOP with the fence held and nothing else changed', async () => {
    const w = make({ bootout: 'fail' });
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'stopped', step: 'stop' });
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-1' });
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(w.plist().WorkingDirectory).toBe(releaseDirectory(w.dataRoot, FROM));
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, step: 'stop' });
    // A person ends it: only that deployment's fence is released, and the STOP record stays for them to remove.
    expect(await endHeldDeployment(w.ctx, { operation: 'end-20261120t031000z-0a0b0c0d', owner: OP })).toMatchObject({ status: 'ended' });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(readDeployStop(w.dataRoot)).not.toBeNull();
    expect(w.calls).toEqual(['acquire', 'bootout', 'release']);
});

test('a fence release that cannot be confirmed ends in STOP on the verified target', async () => {
    const w = make({ release: 'fail' });
    expect(await run(w)).toMatchObject({ status: 'stopped', step: 'release' });
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(TO) });
    expect(readActiveRelease(w.dataRoot)).toMatchObject({ commit: TO });
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test.each(DEPLOY_STEPS.flatMap(step => (['intended', 'ran'] as const).map(phase => [step, phase] as const)))('a controller that dies at %s (%s) resumes to a deployed release without dispatching anything twice', async (step, phase) => {
    const w = make();
    let died = false;
    w.ctx.observe = event => { if (!died && event.operation === OP && event.step === step && event.phase === phase) { died = true; throw new Error('controller killed'); } };
    await expect(run(w)).rejects.toThrow('controller killed');
    expect(readOutcome(w.dataRoot, OP)).toBeNull();
    expect(readDeployJournal(w.dataRoot, OP).last).toMatchObject({ step, state: 'intended' });
    // The dead controller's lock is taken over by the resume of the same operation.
    writeFileSync(deployLockPath(w.dataRoot), JSON.stringify({ pid: 999_999, operation: OP, at: '2026-11-20T03:00:00.000Z' }));
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'deployed' });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(TO) });
    expect(w.fence.read()).toEqual({ status: 'open' });
    expect(readActiveRelease(w.dataRoot)).toMatchObject({ commit: TO, operation: OP });
});

test('a new deployment is refused while an interrupted one has no outcome, and a finished one cannot be resumed', async () => {
    const w = make();
    w.ctx.observe = event => { if (event.operation === OP && event.step === 'backup' && event.phase === 'intended') throw new Error('controller killed'); };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    writeFileSync(deployLockPath(w.dataRoot), JSON.stringify({ pid: 999_999, operation: OP, at: '2026-11-20T03:00:00.000Z' }));
    const other = await deploy(w.ctx, { operation: 'deploy-20261120t040000z-0e0f0a0b', target: TO, controller: PIN });
    expect(other).toMatchObject({ status: 'refused', reason: expect.stringContaining(`deploy resume ${OP}`) });
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'deployed' });
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'refused', reason: expect.stringContaining('already ended deployed') });
    expect(count(w, 'bootstrap')).toBe(1);
});

test('no path pauses, drains or resumes a project', async () => {
    const source = ['deploy', 'rollback', 'end-deployment', 'hold-fence', 'stop-service', 'start-service', 'service-http'].map(name => readFileSync(resolve(__dirname, `../../../server/release/${name}.ts`), 'utf8')).join('\n');
    expect(source).not.toMatch(/api\/commands|'pause'|'resume'|'drain'/);
});

test('a deployment a person ended is recorded ended and cannot be resumed into stopping the service', async () => {
    const w = make();
    w.ctx.observe = event => { if (event.operation === OP && event.step === 'verify' && event.phase === 'intended') throw new Error('controller killed'); };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    expect(await endHeldDeployment(w.ctx, { operation: 'end-20261120t031000z-0a0b0c0d', owner: OP })).toMatchObject({ status: 'ended' });
    expect(readOutcome(w.dataRoot, OP)).toMatchObject({ status: 'ended' });
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'refused', reason: expect.stringContaining('already ended ended') });
    // Even with the recorded outcome lost, a fence released outside the deployment's own steps is not resumed.
    rmSync(operationPaths(w.dataRoot, OP).outcome);
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'refused', reason: expect.stringContaining('released outside its own steps') });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(TO) });
});

test('an unfinished deployment refuses every later one, not only the first, until it is resumed or ended', async () => {
    const w = make();
    w.ctx.observe = event => { if (event.operation === OP && event.step === 'idle' && event.phase === 'intended') throw new Error('controller killed'); };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    for (const suffix of ['1', '2', '3']) {
        const other = await deploy(w.ctx, { operation: `deploy-20261120t04000${suffix}z-0e0f0a0b`, target: TO, controller: PIN });
        expect(other).toMatchObject({ status: 'refused', reason: expect.stringContaining(`deploy resume ${OP}`) });
    }
    expect(await endHeldDeployment(w.ctx, { operation: 'end-20261120t031000z-0a0b0c0d', owner: OP })).toMatchObject({ status: 'ended' });
    expect(await deploy(w.ctx, { operation: 'deploy-20261120t050000z-0e0f0a0b', target: TO, controller: PIN })).toMatchObject({ status: 'deployed' });
});

test.each(['backup', 'snapshot'])('a failed %s leaves the service down when there is no complete store baseline', async phase => {
    const w = make();
    const removeStore = () => rmSync(w.projectDb);
    if (phase === 'backup') removeStore();
    else w.ctx.observe = event => {
        if (event.operation === OP && event.step === phase && event.phase === 'intended') removeStore();
    };
    expect(await run(w)).toMatchObject({ status: 'stopped', step: `${rollbackOperation(OP)}:eligibility`, reason: expect.stringContaining('no store snapshot') });
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(w.service.loaded).toBe(false);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP });
});

test('target drift before plist installation rolls back without starting the target', async () => {
    const w = make(), prior = readFileSync(w.plistPath, 'utf8');
    w.ctx.observe = event => {
        if (event.operation === OP && event.step === 'plist' && event.phase === 'intended')
            writeFileSync(resolve(releaseDirectory(w.dataRoot, TO), 'server/index.ts'), 'tampered\n');
    };
    expect(await run(w)).toMatchObject({ status: 'rolled-back', step: 'plist' });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(readFileSync(w.plistPath, 'utf8')).toBe(prior);
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(FROM), instance: 'instance-2' });
    expect(readDeployJournal(w.dataRoot, rollbackOperation(OP)).facts).toMatchObject({ started: false });
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test.each(['backup', 'snapshot'])('resume stops before %s if launchd has reloaded the service', async step => {
    const w = make();
    w.ctx.observe = event => {
        if (event.operation === OP && event.step === step && event.phase === 'intended') throw new Error('controller killed');
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    w.service.loaded = true;
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'stopped', step, reason: expect.stringContaining('no longer confirmed stopped') });
    const journal = readDeployJournal(w.dataRoot, OP);
    expect(journal.receipts[step]).toBeUndefined();
    expect(existsSync(resolve(releasePaths(w.dataRoot).backups, OP, 'inventory.json'))).toBe(step === 'snapshot');
    expect(existsSync(deployJournalPath(w.dataRoot, rollbackOperation(OP)))).toBe(false);
    expect(w.calls).toEqual(['acquire', 'bootout']);
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test('a changed target is never bootstrapped after interruption following plist installation', async () => {
    const w = make(), execute = w.ctx.execute, bootstrapped: string[] = [];
    w.ctx.execute = async (program, args, options) => {
        if (program === 'launchctl' && args[0] === 'bootstrap') bootstrapped.push(w.plist().WorkingDirectory);
        return execute(program, args, options);
    };
    w.ctx.observe = event => {
        if (event.operation === OP && event.step === 'plist' && event.phase === 'recorded') throw new Error('controller killed');
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    writeFileSync(resolve(releaseDirectory(w.dataRoot, TO), 'server/index.ts'), 'changed\n');
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'rolled-back', step: 'start' });
    expect(bootstrapped).toEqual([releaseDirectory(w.dataRoot, FROM)]);
});

test.each([
    ['record', 'hash'], ['release', 'hash'], ['record', 'instance'], ['release', 'fence'],
])('resuming a pending %s requires the verified target %s', async (step, drift) => {
    const w = make();
    w.ctx.observe = event => {
        if (event.operation === OP && event.step === step && event.phase === 'intended') throw new Error('controller killed');
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    const active = readActiveRelease(w.dataRoot), health = w.ctx.office.health;
    if (drift === 'hash') w.service.hash = 'f'.repeat(64);
    if (drift === 'instance') w.service.instance = 'replacement';
    if (drift === 'fence') w.ctx.office.health = async () => ({ ...await health() as object, fence: { status: 'open' } });
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'stopped', step });
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, step });
    expect(readActiveRelease(w.dataRoot)).toEqual(active);
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
});

test('a service that turns busy just before the stop is left running and the deployment aborts', async () => {
    const w = make(), health = w.ctx.office.health;
    let busy = false;
    w.ctx.office.health = async () => ({ ...(await health() as Record<string, unknown>), busy });
    w.ctx.observe = event => { if (event.step === 'stop' && event.phase === 'intended') busy = true; };
    expect(await run(w)).toMatchObject({ status: 'aborted', step: 'stop' });
    expect(w.calls).toEqual(['acquire', 'release']);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-1' });
    expect(w.fence.read()).toEqual({ status: 'open' });
});

test('a fence taken by another deployment between the plan and the first step refuses, with nothing held', async () => {
    const w = make(), health = w.ctx.office.health;
    let reads = 0;
    w.ctx.office.health = async () => { const answer = await health(); if (reads++ === 0) w.fence.acquire('another-token-0123456789', 'deploy-other'); return answer; };
    // The plan read the fence open inside the health answer; the other deployment took it right after.
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'refused', step: 'fence', reason: expect.stringContaining('held by deploy-other') });
    expect(w.calls).toEqual([]);
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(false);
    expect(readDeployStop(w.dataRoot)).toBeNull();
});

test('a fence acquire that cannot be confirmed ends in STOP before the service is touched', async () => {
    const w = make({ acquire: 'fail' });
    expect(await run(w)).toMatchObject({ status: 'stopped', step: 'fence' });
    expect(w.calls).toEqual(['acquire']);
    expect(w.service).toMatchObject({ loaded: true, instance: 'instance-1' });
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, step: 'fence' });
});

test('a persistence failure after dispatching the fence acquire leaves the held token and a STOP record', async () => {
    const w = make(), db = new DatabaseSync(deployPaths(w.dataRoot).controllerStore);
    try {
        db.exec(`CREATE TRIGGER fail_fence_settlement BEFORE UPDATE ON effects
            WHEN OLD.id = '${OP}:fence' AND OLD.status = 'dispatching'
            BEGIN SELECT RAISE(ABORT, 'cannot persist fence settlement'); END`);
    } finally { db.close(); }
    const fence = w.ctx.office.fence;
    w.ctx.office.fence = async () => w.calls.includes('acquire') ? { status: 'invalid', reason: 'read-back unavailable' } : fence();
    expect(await run(w)).toMatchObject({ status: 'stopped', step: 'fence', reason: expect.stringContaining('cannot persist fence settlement') });
    expect(w.ctx.effects.readIntent(`${OP}:fence`)?.status).toBe('dispatching');
    expect(w.calls).toEqual(['acquire']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, step: 'fence' });
});

test('a controller that dies inside the rollback resumes the rollback, not the deployment', async () => {
    const w = make({ bootstrap: 'silent' }), rb = rollbackOperation(OP);
    let died = false;
    w.ctx.observe = event => {
        if (event.operation === rb && event.step === 'start' && event.phase === 'intended') { w.behaviour.bootstrap = undefined; if (!died) { died = true; throw new Error('controller killed'); } }
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    expect(readDeployJournal(w.dataRoot, rb).last).toMatchObject({ step: 'start', state: 'intended' });
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'rolled-back', step: 'verify', rollback: rb });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'release']);
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(FROM) });
});

test.each(['ran', 'recorded'])('resume after rollback release (%s) records the outcome without releasing twice', async phase => {
    const w = make({ bootstrap: 'wrong-hash' }), rb = rollbackOperation(OP);
    w.ctx.observe = event => {
        if (event.operation !== rb) return;
        if (event.step === 'start' && event.phase === 'intended') w.behaviour.bootstrap = undefined;
        if (event.step === 'release' && event.phase === phase) throw new Error('controller killed');
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(false);
    w.ctx.observe = undefined;
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'rolled-back', rollback: rb });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'release']);
});

test.each(['halt', 'release'])('a person ending the fence during rollback %s does not authorize resume', async step => {
    const w = make({ bootstrap: 'wrong-hash' }), rb = rollbackOperation(OP);
    w.ctx.observe = event => {
        if (event.operation !== rb || event.phase !== 'intended') return;
        if (event.step === 'start') w.behaviour.bootstrap = undefined;
        if (event.step === step) throw new Error('controller killed');
    };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    expect(await endHeldDeployment(w.ctx, { operation: 'end-20261120t031000z-0a0b0c0d', owner: OP })).toMatchObject({ status: 'ended' });
    rmSync(operationPaths(w.dataRoot, OP).outcome);
    const calls = [...w.calls];
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'refused', reason: expect.stringContaining('released outside its own steps') });
    expect(w.calls).toEqual(calls);
});

test.each(['silent', 'wrong-hash'])('a %s rollback instance is halted before STOP and its fence stays held', async mode => {
    const w = make({ bootstrap: mode as Behaviour['bootstrap'] }), rb = rollbackOperation(OP);
    const outcome = await run(w);
    expect(outcome).toMatchObject({ status: 'stopped', step: `${rb}:verify`, reason: expect.stringContaining('the unverified rollback instance was stopped') });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'bootout']);
    expect(w.service.loaded).toBe(false);
    expect(w.ctx.effects.readIntent(`${rb}:halt-unverified`)?.status).toBe('verified');
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
    expect(existsSync(operationPaths(w.dataRoot, OP).token)).toBe(true);
    expect(readDeployStop(w.dataRoot)).toMatchObject({ operation: OP, reason: expect.stringContaining(mode === 'wrong-hash' ? w.hashOf(FROM) : 'did not answer') });
});

test('STOP explains when the unverified rollback instance could not be halted', async () => {
    const w = make({ bootstrap: 'wrong-hash' }), rb = rollbackOperation(OP);
    w.ctx.observe = event => {
        if (event.operation === rb && event.step === 'verify' && event.phase === 'recorded') w.behaviour.bootout = 'fail';
    };
    expect(await run(w)).toMatchObject({ status: 'stopped', step: `${rb}:verify`, reason: expect.stringContaining('its halt could not be confirmed') });
    expect(w.service.loaded).toBe(true);
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'bootout', 'bootstrap', 'bootout']);
    expect(w.fence.read()).toMatchObject({ status: 'held', deployment: OP });
});

test('a journal cut short after a verified start stops for a person; the serving target is not rolled back', async () => {
    const w = make();
    w.ctx.observe = event => { if (event.operation === OP && event.step === 'verify' && event.phase === 'recorded') throw new Error('controller killed'); };
    await expect(run(w)).rejects.toThrow('controller killed');
    w.ctx.observe = undefined;
    appendFileSync(deployJournalPath(w.dataRoot, OP), '{"type":"step","operation":"');
    expect(await resumeDeploy(w.ctx, OP)).toMatchObject({ status: 'stopped', reason: expect.stringContaining('cut-short') });
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap']);
    expect(w.service).toMatchObject({ loaded: true, hash: w.hashOf(TO) });
    expect(existsSync(deployJournalPath(w.dataRoot, rollbackOperation(OP)))).toBe(false);
});

test('a running process that is not the release its plist names is refused', async () => {
    const w = make(), health = w.ctx.office.health;
    w.ctx.office.health = async () => ({ ...(await health() as Record<string, unknown>), loadedHash: 'e'.repeat(64) });
    expect(await run(w)).toMatchObject({ status: 'refused', reason: expect.stringContaining('restart it before deploying') });
    expect(w.calls).toEqual([]);
});

test('a busy service is fenced so its work can drain, and is stopped only once it reads idle twice', async () => {
    const w = make({ busy: true });
    let stoppedWhileBusy = false;
    const execute = w.ctx.execute;
    w.ctx.execute = (async (program: string, args: string[], options: any) => { if (args[0] === 'bootout' && w.behaviour.busy) stoppedWhileBusy = true; return execute(program, args, options); }) as typeof execute;
    // The work in flight ends twenty seconds after the fence is taken.
    const sleep = w.ctx.sleep, started = w.clock.ms;
    w.ctx.sleep = async ms => { await sleep(ms); if (w.clock.ms - started >= 20_000) w.behaviour.busy = false; };
    expect(await run(w)).toMatchObject({ status: 'deployed' });
    expect(stoppedWhileBusy).toBe(false);
    expect(w.calls).toEqual(['acquire', 'bootout', 'bootstrap', 'release']);
    expect(readDeployJournal(w.dataRoot, OP).receipts.idle.observations).toHaveLength(2);
});
