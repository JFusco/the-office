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
