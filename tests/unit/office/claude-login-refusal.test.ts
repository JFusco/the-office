import { describe, expect, test } from 'vitest';
import { claudeLoginRefusal, claudeRefusalWords, refusedClaudeRow } from '../../../server/office/claude-login-refusal';
import type { ServiceHealth, WorkTime } from '../../../src/shared';

/** Claude's words for each refusal, recorded with Claude Code 2.1.328 (#552). */
const RECORDED = [
    'Not logged in · Please run /login',
    'Invalid API key · Fix external API key',
    'Failed to authenticate. API Error: 401 OAuth access token is invalid.',
    'Failed to authenticate: OAuth session expired and could not be refreshed',
];
const WORDS = RECORDED[3];
const at = (minute: number) => new Date(Date.UTC(2026, 10, 24, 19, minute)).toISOString();
const time = (minute: number) => Date.parse(at(minute));
const run = (minute: number, fields: Partial<WorkTime> = {}) => ({ provider: 'claude', status: 'completed', endedAt: at(minute), ...fields }) as WorkTime;
const failed = (minute: number, detail: string, fields: Partial<WorkTime> = {}) =>
    run(minute, { status: 'failed', failure: { category: 'uncertain-effect', dispatched: true, detail }, ...fields });
const refused = (minute: number, fields: Partial<WorkTime> = {}) => failed(minute, `claude exited 1: ${WORDS}`, fields);
const refusal = (workLog: WorkTime[], since = time(0), signedOutAt = 0) => claudeLoginRefusal(workLog, since, signedOutAt);

describe('claudeRefusalWords', () => {
    test.each(RECORDED)('returns Claude’s words for a recorded refusal: %s', words => {
        expect(claudeRefusalWords(`claude exited 1: ${words}`)).toBe(words);
        expect(claudeRefusalWords(`claude exited 143: ${words}\n`)).toBe(words);
    });

    test.each([
        'claude exited 1: API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)',
        'claude exited 1: Failed to authenticate. API Error: 500 Internal server error',
        'claude exited 1: Failed to authenticate: API Error: Connection refused',
        'codex exited 1: Not logged in · Please run /login',
        'claude exited null: Not logged in · Please run /login',
        'claude exited 0: Not logged in · Please run /login',
        'Worker timed out after 600 seconds',
        'claude exited 1: The model wrote: Not logged in · Please run /login',
        'claude exited 1: Not logged in · Please run /login and check the proxy',
        'claude exited 1: not logged in · please run /login',
    ])('does not read other failures as a login refusal: %s', detail => {
        expect(claudeRefusalWords(detail)).toBeUndefined();
    });
});

describe('claudeLoginRefusal', () => {
    test('a refusal after the latest completed run stands; a completed run after it clears it', () => {
        expect(refusal([run(1), refused(2)])).toEqual({ at: at(2), words: WORDS });
        expect(refusal([refused(1), run(2)])).toBeUndefined();
        expect(refusal([refused(1), run(2), refused(3)])).toEqual({ at: at(3), words: WORDS });
    });

    test('a later run whose execution completed clears it, whatever the task outcome', () => {
        expect(refusal([refused(1), run(2, { status: 'blocked', executionStatus: 'completed' })])).toBeUndefined();
        expect(refusal([refused(1), failed(2, 'claude exited 0: invalid output', { executionStatus: 'completed' })])).toBeUndefined();
    });

    test('other failures, interruptions, other providers and unreadable end times settle nothing', () => {
        const ignored = [
            failed(2, 'claude exited 1: API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)'),
            run(3, { status: 'interrupted' }), run(4, { status: 'running', endedAt: '' }), run(5, { provider: 'codex' }),
        ];
        expect(refusal([refused(1), ...ignored])).toEqual({ at: at(1), words: WORDS });
        expect(refusal([run(1), refused(2, { status: 'interrupted' }), refused(3, { provider: 'codex' }), refused(4, { endedAt: 'not a time' })])).toBeUndefined();
    });

    test('a refusal must be strictly later than the process start and the check’s own signed-out reading', () => {
        expect(refusal([refused(2)], time(2))).toBeUndefined();
        expect(refusal([refused(2)], time(0), time(2))).toBeUndefined();
        expect(refusal([refused(3)], time(2), time(2))).toEqual({ at: at(3), words: WORDS });
    });

    test('a completed run at the same moment as the refusal keeps the probe’s reading, in either order', () => {
        expect(refusal([refused(1), run(1)])).toBeUndefined();
        expect(refusal([run(1), refused(1)])).toBeUndefined();
    });
});

test('refusedClaudeRow reports the row signed out, quotes Claude and keeps the probe’s fields', () => {
    const row: ServiceHealth = { id: 'anthropic', name: 'Anthropic · Claude', status: 'connected', kind: 'login', detail: 'Claude reports a configured login. No model call was made.', identity: 'fixture@example.test', nextStep: 'Check Claude’s /login in your terminal, then refresh.', checkedAt: at(5), expiresAt: at(8), lastFailure: { at: at(4), detail: 'GH-1 · implement failed.' } };
    expect(refusedClaudeRow(row, { at: at(4), words: RECORDED[1] })).toEqual({ ...row, status: 'disconnected', detail: 'Claude refused the Office’s login during a worker run. Its status command still reports a configured login.', failure: RECORDED[1] });
});
