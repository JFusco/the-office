import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { command } from '../../../server/workers/process';

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
    await expect(command(process.execPath, c.args, { timeout: 300, interruptFirst: true, interruptGraceMs: 2000 })).rejects.toThrow('timed out');
    expect(c.saw('interrupted')).toBe(true);
    expect(c.saw('terminated')).toBe(false);
});

test('a run that ignores the interrupt is terminated after the grace period', async () => {
    const c = child('ignore'), started = Date.now();
    await expect(command(process.execPath, c.args, { timeout: 300, interruptFirst: true, interruptGraceMs: 400 })).rejects.toThrow('timed out');
    expect(c.saw('interrupted')).toBe(true);
    expect(c.saw('terminated')).toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(650);
});

test('without the option a run is terminated directly, as before', async () => {
    const c = child('exit');
    await expect(command(process.execPath, c.args, { timeout: 300 })).rejects.toThrow('timed out');
    expect(c.saw('interrupted')).toBe(false);
    expect(c.saw('terminated')).toBe(true);
});

test('a silent run is stopped by the stall limit with its own reason, interrupt first', async () => {
    const c = child('exit');
    await expect(command(process.execPath, c.args, { timeout: 0, inactivityTimeout: 300, interruptFirst: true })).rejects.toThrow('stopped producing output');
    expect(c.saw('interrupted')).toBe(true);
});
