import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { controllerEffects } from '../../../server/release/controller-effects';
import { settle, type Mutation } from '../../../server/release/settle-mutation';
import { deployPaths } from '../../../server/release/deploy-paths';

const closers: (() => void)[] = [], roots: string[] = [];
afterEach(() => { closers.splice(0).forEach(close => close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-settle-')); roots.push(root);
    const { effects, close } = controllerEffects(root); closers.push(close);
    const world = { applied: false, dispatched: 0 };
    const mutation = (over: Partial<Mutation> = {}): Mutation => ({
        effects, operation: 'deploy-20261120t030000z-0a0b0c0d', step: 'stop', payload: { pid: 1 },
        dispatch: async () => { world.dispatched++; world.applied = true; },
        confirm: async () => world.applied ? { stopped: true } : null, ...over,
    });
    return { root, world, mutation };
}

test('a mutation is dispatched once, verified by read-back, and kept in the controller store under deployments/', async () => {
    const { root, world, mutation } = setup();
    expect(await settle(mutation())).toEqual({ status: 'verified', receipt: { stopped: true } });
    expect(await settle(mutation())).toEqual({ status: 'verified', receipt: { stopped: true } });
    expect(world.dispatched).toBe(1);
    expect(existsSync(deployPaths(root).controllerStore)).toBe(true);
});

test('an outcome already visible is confirmed without a dispatch', async () => {
    const { world, mutation } = setup();
    world.applied = true;
    expect(await settle(mutation())).toMatchObject({ status: 'verified' });
    expect(world.dispatched).toBe(0);
});

test('a preflight refusal dispatches nothing and stays refused', async () => {
    const { world, mutation } = setup(), refusing = mutation({ preflight: async () => { throw new Error('the service is busy'); } });
    expect(await settle(refusing)).toEqual({ status: 'rejected', reason: expect.stringContaining('the service is busy') });
    expect(await settle(mutation())).toMatchObject({ status: 'rejected' });
    expect(world.dispatched).toBe(0);
});

test('a dispatch that failed but whose outcome read-back shows is verified; one read-back cannot show is uncertain and never resent', async () => {
    const landed = setup();
    expect(await settle(landed.mutation({ dispatch: async () => { landed.world.dispatched++; landed.world.applied = true; throw new Error('exit 36'); } }))).toMatchObject({ status: 'verified' });
    const lost = setup(), failing = lost.mutation({ dispatch: async () => { lost.world.dispatched++; throw new Error('exit 5'); } });
    expect(await settle(failing)).toEqual({ status: 'uncertain', reason: expect.stringContaining('exit 5') });
    expect(await settle(lost.mutation())).toMatchObject({ status: 'uncertain' });
    expect(lost.world.dispatched).toBe(1);
    // Once the world shows it, the same step settles by read-back alone.
    const intentId = `${failing.operation}:${failing.step}`;
    expect(failing.effects.readIntent(intentId)?.status).toBe('uncertain');
    lost.world.applied = true;
    expect(await settle(lost.mutation())).toMatchObject({ status: 'verified' });
    expect(failing.effects.readIntent(intentId)).toMatchObject({ status: 'verified', receipt: { stopped: true } });
    expect(lost.world.dispatched).toBe(1);
});

test('a resumed step that presents a different payload is refused', async () => {
    const { world, mutation } = setup();
    await settle(mutation({ dispatch: async () => { world.dispatched++; } }));
    expect(await settle(mutation({ payload: { pid: 2 } }))).toEqual({ status: 'rejected', reason: expect.stringContaining('different operation') });
    expect(world.dispatched).toBe(1);
});

test('a step recorded verified whose outcome is no longer visible is uncertain, not done', async () => {
    const { world, mutation } = setup();
    expect(await settle(mutation())).toMatchObject({ status: 'verified' });
    // The world moved on after the effect was verified, as when launchd reloads a stopped service at login.
    world.applied = false;
    expect(await settle(mutation())).toEqual({ status: 'uncertain', reason: expect.stringContaining('no longer shows') });
    expect(world.dispatched).toBe(1);
});

const unreadable = (failures: number, world: { applied: boolean }) => { let left = failures; return async () => { if (left-- > 0) throw new Error('TypeError: fetch failed'); return world.applied ? { stopped: true } : null; }; };

test('a first read that fails before anything was sent is a refusal that saves nothing, and the step settles once it can be read', async () => {
    const { world, mutation } = setup(), first = mutation({ confirm: unreadable(1, world) });
    expect(await settle(first)).toEqual({ status: 'rejected', reason: 'the outcome of step stop could not be read before anything was sent: Error: TypeError: fetch failed' });
    expect(world.dispatched).toBe(0);
    expect(first.effects.readIntent(`${first.operation}:${first.step}`)).toBeUndefined();
    expect(await settle(mutation())).toEqual({ status: 'verified', receipt: { stopped: true } });
    expect(world.dispatched).toBe(1);
});

test('a first read that fails after a refused preflight is still a refusal: nothing was sent', async () => {
    const { world, mutation } = setup(), refusing = mutation({ preflight: async () => { throw new Error('the service is busy'); } });
    expect(await settle(refusing)).toMatchObject({ status: 'rejected' });
    expect(refusing.effects.readIntent(`${refusing.operation}:${refusing.step}`)?.status).toBe('rejected');
    expect(await settle(mutation({ confirm: unreadable(1, world) }))).toEqual({ status: 'rejected', reason: expect.stringContaining('could not be read before anything was sent') });
    expect(world.dispatched).toBe(0);
});

test('a first read that fails after an earlier run sent the step stays unknown: it is never a refusal and nothing is sent again', async () => {
    // Sent and unconfirmed: the intent is uncertain.
    const lost = setup();
    expect(await settle(lost.mutation({ dispatch: async () => { lost.world.dispatched++; throw new Error('exit 5'); } }))).toMatchObject({ status: 'uncertain' });
    await expect(settle(lost.mutation({ confirm: unreadable(1, lost.world) }))).rejects.toThrow('fetch failed');
    expect(lost.world.dispatched).toBe(1);
    // Sent and verified: a read that now fails says nothing about it either.
    const done = setup();
    expect(await settle(done.mutation())).toMatchObject({ status: 'verified' });
    await expect(settle(done.mutation({ confirm: unreadable(1, done.world) }))).rejects.toThrow('fetch failed');
    expect(done.world.dispatched).toBe(1);
});

test('a first read that fails while another run of the step is still in its preflight is a refusal: nothing was sent yet', async () => {
    const { world, mutation } = setup();
    let release!: (error: Error) => void;
    const waiting = settle(mutation({ preflight: () => new Promise<void>((_, reject) => { release = reject; }) }));
    // The first run has saved its intent and is waiting in the preflight: prepared, not dispatched.
    await new Promise(resolve => setTimeout(resolve, 0));
    const probe = mutation();
    expect(probe.effects.readIntent(`${probe.operation}:${probe.step}`)?.status).toBe('prepared');
    expect(await settle(mutation({ confirm: unreadable(1, world) }))).toEqual({ status: 'rejected', reason: expect.stringContaining('could not be read before anything was sent') });
    release(new Error('the service is busy'));
    expect(await waiting).toMatchObject({ status: 'rejected' });
    expect(world.dispatched).toBe(0);
});

test('a first read that fails after another run starts dispatching propagates the read error', async () => {
    const { world, mutation } = setup();
    const readError = new Error('fetch failed');
    let markPrepared!: () => void;
    let continuePreflight!: () => void;
    let markDispatching!: () => void;
    let finishDispatch!: () => void;
    let failRead!: (error: Error) => void;
    const prepared = new Promise<void>(resolve => { markPrepared = resolve; });
    const preflight = new Promise<void>(resolve => { continuePreflight = resolve; });
    const dispatching = new Promise<void>(resolve => { markDispatching = resolve; });
    const dispatch = new Promise<void>(resolve => { finishDispatch = resolve; });
    const read = new Promise<never>((_, reject) => { failRead = reject; });
    const probe = mutation({ confirm: () => read });
    const intentId = `${probe.operation}:${probe.step}`;
    const sending = settle(mutation({
        preflight: () => { markPrepared(); return preflight; },
        dispatch: async () => {
            world.dispatched++;
            markDispatching();
            await dispatch;
            world.applied = true;
        },
    }));

    try {
        await prepared;
        expect(probe.effects.readIntent(intentId)?.status).toBe('prepared');
        const reading = settle(probe);
        continuePreflight();
        await dispatching;
        expect(probe.effects.readIntent(intentId)?.status).toBe('dispatching');
        failRead(readError);
        await expect(reading).rejects.toBe(readError);
        expect(world.dispatched).toBe(1);
    } finally {
        continuePreflight();
        finishDispatch();
        await sending;
    }
});
