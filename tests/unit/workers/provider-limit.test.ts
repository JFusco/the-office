import { expect, test } from 'vitest';
import { exitFailure } from '../../../server/workers/exit-failure';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { command, CommandFailure, workerFailure } from '../../../server/workers/process';
import { providerLimit } from '../../../server/workers/provider-limit';

/** The failure recorded on 2026-11-23, as the runner worded it. */
const RECORDED = 'codex exited 1: You’ve hit your usage limit. Visit https://chatgpt.com/settings/usage to purchase more credits or try again at Nov 24th, 2026 11:50 AM.';
/** The provider prints no zone; the time is read as this machine's. */
const local = (year: number, month: number, day: number, hour: number, minute: number) => new Date(year, month - 1, day, hour, minute).toISOString();

test('the provider\'s usage-limit refusal is recognised with the time it says to try again', () => {
    expect(providerLimit('codex', RECORDED)).toEqual({ retryAt: local(2026, 11, 24, 11, 50) });
    expect(providerLimit('codex', RECORDED.replace('’', "'"))).toEqual({ retryAt: local(2026, 11, 24, 11, 50) });
    for (const [said, at] of [['Jan 1st, 2027 12:05 AM', local(2027, 1, 1, 0, 5)], ['Dec 22nd, 2026 12:00 PM', local(2026, 12, 22, 12, 0)], ['Mar 3rd, 2027 9:07 PM', local(2027, 3, 3, 21, 7)]])
        expect(providerLimit('codex', RECORDED.replace('Nov 24th, 2026 11:50 AM', said)), said).toEqual({ retryAt: at });
});

test('a reset later the same day gives only the time: it is the next such time after now', () => {
    /** CEC-154's refusal, as recorded on 2026-11-17. */
    const sameDay = 'codex exited 1: You’ve hit your usage limit. Visit the usage page to purchase more credits or try again at 7:19 PM.';
    expect(providerLimit('codex', sameDay, new Date(2026, 10, 17, 16, 49))).toEqual({ retryAt: local(2026, 11, 17, 19, 19) });
    expect(providerLimit('codex', sameDay, new Date(2026, 10, 17, 19, 19))).toEqual({ retryAt: local(2026, 11, 18, 19, 19) });
    expect(providerLimit('codex', sameDay.replace('7:19 PM', '12:10 AM'), new Date(2026, 11, 31, 23, 50))).toEqual({ retryAt: local(2027, 1, 1, 0, 10) });
    expect(providerLimit('codex', sameDay.replace('7:19 PM', '13:19 PM'), new Date(2026, 10, 17, 16, 49))).toEqual({});
});

test('a time the local clock skips for daylight saving is not what the provider said', () => {
    // Only where the machine's zone skips an hour does a constructed time move; elsewhere every time is held.
    const skipped = new Date(2027, 2, 14, 2, 30), moves = skipped.getHours() !== 2;
    const said = (time: string) => providerLimit('codex', RECORDED.replace('Nov 24th, 2026 11:50 AM', `Mar 14th, 2027 ${time}`));
    expect(said('2:30 AM')).toEqual(moves ? {} : { retryAt: skipped.toISOString() });
    expect(said('3:30 AM')).toEqual({ retryAt: local(2027, 3, 14, 3, 30) });
    expect(providerLimit('codex', RECORDED.replace('Nov 24th, 2026 11:50 AM.', '2:30 AM.'), new Date(2027, 2, 14, 1, 0))).toEqual(moves ? {} : { retryAt: skipped.toISOString() });
});

test('a limit whose reset time is missing or not a real time is still a limit, without a time', () => {
    expect(providerLimit('codex', 'codex exited 1: You’ve hit your usage limit.')).toEqual({});
    expect(providerLimit('codex', 'codex exited 1: You’ve hit your usage limit. Upgrade to Pro or try again in 3 hours.')).toEqual({});
    for (const said of ['Feb 31st, 2027 11:50 AM', 'Nov 24th, 2026 13:50 PM', 'Nov 24th, 2026 0:50 AM', 'Nov 24th, 2026 11:75 AM', 'Foo 24th, 2026 11:50 AM'])
        expect(providerLimit('codex', RECORDED.replace('Nov 24th, 2026 11:50 AM', said)), said).toEqual({});
});

test('anything else is not a limit: another program, another failure, or the same words anywhere but the start', () => {
    expect(providerLimit('claude', RECORDED)).toBeUndefined();
    expect(providerLimit('pnpm', RECORDED.replace('codex', 'pnpm'))).toBeUndefined();
    expect(providerLimit('codex', RECORDED.replace('codex exited', 'pnpm exited'))).toBeUndefined();
    expect(providerLimit('codex', 'codex exited 1: stream error; the model wrote "You’ve hit your usage limit." in its answer')).toBeUndefined();
    expect(providerLimit('codex', `codex exited 1: tool output\n${RECORDED}`)).toBeUndefined();
    expect(providerLimit('codex', 'codex exited 1: You’ve hit your usage limits for images')).toBeUndefined();
    expect(providerLimit('codex', 'codex exited 1: No provider diagnostic was returned. Read the saved session before another attempt.')).toBeUndefined();
});

test('a read-only run refused at the limit fails as a provider limit; a writer keeps an effect of unknown outcome', () => {
    const event = JSON.stringify({ type: 'error', message: RECORDED.slice('codex exited 1: '.length) });
    const message = workerFailure('codex', 1, `${event}\n`, '');
    expect(message).toBe(RECORDED);
    const reader = exitFailure('codex', message, true);
    expect([reader.category, reader.dispatched, reader.retryAt, reader.message]).toEqual(['provider-limit', true, local(2026, 11, 24, 11, 50), RECORDED]);
    const writer = exitFailure('codex', message, false);
    expect([writer.category, writer.dispatched, writer.retryAt]).toEqual(['uncertain-effect', true, undefined]);
    // An ordinary non-zero exit is what it was.
    expect(exitFailure('codex', 'codex exited 1: stream disconnected', true).category).toBe('other');
    expect(exitFailure('pnpm', 'pnpm exited 1: lint failed', true).category).toBe('other');
    expect(exitFailure('codex', 'codex exited 1: stream disconnected', false).category).toBe('uncertain-effect');
});

test('the runner itself fails a refused read-only process as a provider limit, and a refused writer as before', async () => {
    const bin = mkdtempSync(resolve(tmpdir(), 'office-limit-'));
    try {
        const event = JSON.stringify({ type: 'error', message: RECORDED.slice('codex exited 1: '.length) });
        writeFileSync(resolve(bin, 'codex'), `#!/bin/sh\ncat <<'EOF'\n${event}\nEOF\nexit 1\n`, { mode: 0o755 });
        const env = { PATH: `${bin}:${process.env.PATH}` };
        const reader = await command('codex', [], { env, readOnly: true, timeout: 5000 }).catch(error => error);
        expect(reader).toBeInstanceOf(CommandFailure);
        expect([reader.category, reader.retryAt, reader.message]).toEqual(['provider-limit', local(2026, 11, 24, 11, 50), RECORDED]);
        const writer = await command('codex', [], { env, timeout: 5000 }).catch(error => error);
        expect([writer.category, writer.retryAt]).toEqual(['uncertain-effect', undefined]);
    } finally { rmSync(bin, { recursive: true, force: true }); }
});
