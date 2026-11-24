import { expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stopService } from '../../../server/release/stop-service';
import { make, OP } from './step-fixture';

test('the service is removed from launchd and the stop is confirmed only once its process is gone', async () => {
    const w = make();
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toEqual({ status: 'verified', receipt: { loaded: false, pid: 4001 } });
    expect(w.service.loaded).toBe(false);
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toMatchObject({ status: 'verified' });
    expect(w.calls).toEqual(['bootout']);
});

test('a service already stopped is confirmed without a stop; a refusal from `ready` sends none', async () => {
    const stopped = make();
    stopped.service.loaded = false; stopped.ctx.alive = () => false;
    expect(await stopService(stopped.ctx, OP, 'halt', null)).toMatchObject({ status: 'verified' });
    expect(stopped.calls).toEqual([]);
    const busy = make();
    expect(await stopService(busy.ctx, OP, 'stop', 4001, async () => { throw new Error('no longer idle'); })).toEqual({ status: 'rejected', reason: expect.stringContaining('no longer idle') });
    expect(busy.calls).toEqual([]);
    expect(busy.service.loaded).toBe(true);
});

test('launchd no longer having the service is not enough while its process or the lock owner is alive', async () => {
    const w = make();
    // The stop leaves a process behind that still owns the service lock.
    writeFileSync(resolve(w.dataRoot, 'service.pid'), '4999');
    const alive = w.ctx.alive;
    w.ctx.alive = pid => pid === 4999 || alive(pid);
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toMatchObject({ status: 'uncertain' });
    expect(w.clock.ms - Date.parse('2026-11-20T03:00:00.000Z')).toBeGreaterThanOrEqual(w.ctx.timings.stopDeadlineMs);
    w.ctx.alive = alive;
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toMatchObject({ status: 'verified' });
    expect(w.calls).toEqual(['bootout']);
});

test('a stop that was sent and did not land is uncertain and never sent again, whatever process is asked about later', async () => {
    const w = make({ bootout: 'fail' });
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toMatchObject({ status: 'uncertain' });
    w.behaviour.bootout = undefined;
    // A different process ID does not make it a different effect.
    expect(await stopService(w.ctx, OP, 'stop', 4002)).toMatchObject({ status: 'uncertain' });
    expect(w.calls).toEqual(['bootout']);
    expect(w.service.loaded).toBe(true);
});

test('an inconclusive launchd answer is not read as stopped: before anything was sent it is a refusal', async () => {
    const w = make(), execute = w.ctx.execute;
    w.ctx.execute = (async (program: string, args: string[], options: any) => { if (args[0] === 'print') throw new Error('launchctl read timed out'); return execute(program, args, options); }) as typeof execute;
    expect(await stopService(w.ctx, OP, 'stop', 4001)).toEqual({ status: 'rejected', reason: expect.stringContaining('timed out') });
    expect(w.calls).toEqual([]);
    expect(w.service.loaded).toBe(true);
});
