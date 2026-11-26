import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { pauseRunner, readHalt, readPause, readStop, unpauseRunner, writeRunnerStop } from '../../../server/overseer/kill-switch';
import { runnerRoot, tempDir } from './runner-world';

const at = (minute: number) => () => new Date(`2026-11-25T12:0${minute}:00.000Z`);

test('nothing holds a runner with no control files', () => {
    expect(readHalt(runnerRoot())).toBeNull();
});

test('a pause holds the runner, and STOP takes precedence over it', () => {
    const paths = runnerRoot();
    pauseRunner(paths, 'looking at a fix', at(0));
    expect(readHalt(paths)).toEqual({ kind: 'paused', reason: 'Paused: looking at a fix' });
    writeRunnerStop(paths, { reason: 'state unreadable', instruction: 'look' }, at(1));
    expect(readHalt(paths)).toEqual({ kind: 'stopped', reason: 'STOP: state unreadable' });
});

test('a STOP or pause file that cannot be trusted counts as STOP', () => {
    const cases: [string, (paths: ReturnType<typeof runnerRoot>) => void][] = [
        ['malformed STOP', paths => writeFileSync(paths.stop, '{')],
        ['STOP of another shape', paths => writeFileSync(paths.stop, JSON.stringify({ version: 2 }))],
        ['linked STOP', paths => { const target = join(tempDir(), 'stop.json'); writeFileSync(target, '{}'); symlinkSync(target, paths.stop); }],
        ['malformed pause', paths => writeFileSync(paths.pause, 'paused')],
        ['linked pause', paths => { const target = join(tempDir(), 'pause.json'); writeFileSync(target, JSON.stringify({ version: 1, at: '2026-11-25T12:00:00.000Z', reason: 'x' })); symlinkSync(target, paths.pause); }],
        ['pause that is a folder', paths => mkdirSync(paths.pause)],
    ];
    for (const [name, make] of cases) {
        const paths = runnerRoot();
        mkdirSync(paths.control, { recursive: true });
        make(paths);
        expect(readHalt(paths)?.kind, name).toBe('stopped');
        expect(readHalt(paths)?.reason, name).toContain('cannot be read');
    }
});

test('STOP keeps its first explanation', () => {
    const paths = runnerRoot();
    expect(writeRunnerStop(paths, { reason: 'first', instruction: 'one' }, at(0))).toBe(true);
    expect(writeRunnerStop(paths, { reason: 'second', instruction: 'two' }, at(1))).toBe(false);
    expect(readStop(paths)).toEqual({ record: { version: 1, at: '2026-11-25T12:00:00.000Z', reason: 'first', instruction: 'one' } });
});

test('a pause keeps its first reason, and unpause removes only the pause', () => {
    const paths = runnerRoot();
    expect(pauseRunner(paths, 'first', at(0)).written).toBe(true);
    const again = pauseRunner(paths, 'second', at(1));
    expect(again.written).toBe(false);
    expect(again.pause).toEqual({ record: { version: 1, at: '2026-11-25T12:00:00.000Z', reason: 'first' } });
    writeRunnerStop(paths, { reason: 'held', instruction: 'look' }, at(2));
    const stop = readFileSync(paths.stop, 'utf8');
    expect(unpauseRunner(paths)).toBe(true);
    expect(unpauseRunner(paths)).toBe(false);
    expect(readPause(paths)).toEqual({ absent: true });
    expect(readFileSync(paths.stop, 'utf8')).toBe(stop);
    expect(readHalt(paths)?.kind).toBe('stopped');
    expect(existsSync(paths.stop)).toBe(true);
});
