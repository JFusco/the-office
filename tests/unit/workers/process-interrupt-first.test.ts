import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { command } from '../../../server/workers/process';
import { temporaryReadFailure } from '../../../server/scheduling/read-retries';

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
/** A long-running child that records which stop signal it received, in its own directory. */
function child(onInterrupt: 'exit' | 'ignore') {
    const root = mkdtempSync(resolve(tmpdir(), 'office-interrupt-')); roots.push(root);
    const mark = (name: string) => `require('node:fs').writeFileSync(${JSON.stringify(resolve(root, name))},'')`;
    const script = `process.on('SIGINT',()=>{${mark('interrupted')};${onInterrupt === 'exit' ? 'process.exit(0)' : ''}});process.on('SIGTERM',()=>{${mark('terminated')};process.exit(0)});setInterval(()=>{},1000);`;
    return { root, args: ['-e', script], saw: (name: string) => existsSync(resolve(root, name)) };
}

test('a run stopped at its time limit is interrupted first, and is not terminated when it exits on the interrupt', async () => {
    const c = child('exit');
    const failure = await command(process.execPath, c.args, { timeout: 2000, interruptFirst: true, interruptGraceMs: 3000 }).catch(error => error);
    expect(String(failure)).toContain('timed out');
    // The failure says the run was interrupted, so what it printed afterwards is not taken as its own completion.
    expect(failure.interrupted).toBe(true);
    expect(c.saw('interrupted')).toBe(true);
    expect(c.saw('terminated')).toBe(false);
});

test('a run that ignores the interrupt is terminated after the grace period', async () => {
    const c = child('ignore'), started = Date.now();
    await expect(command(process.execPath, c.args, { timeout: 2000, interruptFirst: true, interruptGraceMs: 500 })).rejects.toThrow('timed out');
    expect(c.saw('interrupted')).toBe(true);
    expect(c.saw('terminated')).toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(2400);
});

test('without the option a run is terminated directly, as before', async () => {
    const c = child('exit');
    await expect(command(process.execPath, c.args, { timeout: 2000 })).rejects.toThrow('timed out');
    expect(c.saw('interrupted')).toBe(false);
    expect(c.saw('terminated')).toBe(true);
});

test('a silent run is stopped by the stall limit with its own reason, interrupt first', async () => {
    const c = child('exit');
    await expect(command(process.execPath, c.args, { timeout: 0, inactivityTimeout: 2000, interruptFirst: true })).rejects.toThrow('stopped producing output');
    expect(c.saw('interrupted')).toBe(true);
});

test('helpers left behind by a leader that already exited are terminated at once, with no interrupt wait', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-interrupt-')); roots.push(root);
    // The leader starts a helper in its own process group, then exits cleanly while the helper keeps running.
    const helper = `process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);`;
    const leader = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(helper)}],{stdio:'ignore'});setTimeout(()=>process.exit(0),300);`;
    const started = Date.now();
    const failure = await command(process.execPath, ['-e', leader], { timeout: 20000, interruptFirst: true, interruptGraceMs: 8000 }).catch(error => error);
    expect(failure.code).toBe('surviving-subprocesses');
    expect(failure.interrupted).toBe(false);
    expect(Date.now() - started).toBeLessThan(6000);
});

test('a reader that goes silent gets a reason that is safe to retry', async () => {
    const c = child('exit');
    await expect(command(process.execPath, c.args, { timeout: 0, inactivityTimeout: 1500, readOnly: true })).rejects.toThrow('read stopped producing output; saved observations retained; safe to retry the read');
    // The read-retry rule recognises that wording; the writer's stall wording is not retried as a read.
    expect(temporaryReadFailure('Error: codex read stopped producing output; saved observations retained; safe to retry the read')).toBe(true);
    expect(temporaryReadFailure('Error: codex stopped producing output; inspect the retained worker evidence')).toBe(false);
});
