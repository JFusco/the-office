import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { GitHubMonitor } from '../../../server/github/github';
import { boardReadFailure } from '../../../server/github/board-read-failure';
import { CommandFailure } from '../../../server/workers/process';
import type { CommandOptions } from '../../../server/workers/spawn-command';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const WAIT = "Wait for GitHub's rate limit to clear before retrying the board read.";
const ACCESS = 'Run gh auth refresh -h github.com -s project in your terminal, then recheck Projects access in the Office account.';
const RETRY = 'Retry the read-only project refresh; the last verified board is retained.';
const REFUSAL = 'API rate limit exceeded for user ID 1.';

/** The Brain board read through `board()` over one injected page executor, with no board seen before. */
async function readBoard(page: (options: CommandOptions) => string, onGitHubRefusal?: (message: string) => void) {
    const root = mkdtempSync(join(tmpdir(), 'office-board-failure-'));
    const store = new Store(':memory:', projectById('brain'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    const board = await new GitHubMonitor(store, (async (_program: string, _args: string[], options: CommandOptions = {}) => page(options)) as any).board(undefined, onGitHubRefusal);
    return board!.error;
}
const count = (text: string, part: string) => text.split(part).length - 1;

test('a thrown secondary HTTP 403 is a refusal, not an access failure: it gets the wait, not the auth refresh', async () => {
    const error = await readBoard(() => { throw new CommandFailure('gh exited 1: gh: You have exceeded a secondary rate limit (HTTP 403)', 'other', true); });
    expect(error).toBe(`GitHub Project read failed: Error: gh exited 1: gh: You have exceeded a secondary rate limit (HTTP 403). ${WAIT}`);
});

test('a returned GraphQL primary refusal gets the wait', async () => {
    expect(await readBoard(() => JSON.stringify({ errors: [{ message: REFUSAL }] }))).toBe(`GitHub Project read failed: Error: ${REFUSAL} ${WAIT}`);
});

test('a refusal the runner matched only in stdout is named once beside the generic error, and told once to the caller', async () => {
    const told: string[] = [];
    const error = await readBoard(options => { options.onGitHubRefusal?.(REFUSAL); throw new CommandFailure('gh exited 1: query failed', 'other', true); }, message => told.push(message));
    expect(error).toBe(`GitHub Project read failed: Error: gh exited 1: query failed: ${REFUSAL} ${WAIT}`);
    expect(count(error, REFUSAL)).toBe(1);
    expect(told).toEqual([REFUSAL]);
    // Without a caller of its own the board still keeps the match for its diagnostic.
    expect(await readBoard(options => { options.onGitHubRefusal?.(REFUSAL); throw new CommandFailure('gh exited 1: query failed', 'other', true); })).toContain(WAIT);
});

test.each([
    'gh exited 1: gh: Resource not accessible by integration',
    'gh exited 1: gh: Forbidden (HTTP 403)',
    'HTTP 403',
])('"%s" is an access failure and keeps the access hint', async message => {
    const error = await readBoard(() => { throw new CommandFailure(message, 'other', true); });
    expect(error).toBe(`GitHub Project read failed: Error: ${message}. ${ACCESS}`);
});

test('an unrelated failure keeps the retry', async () => {
    expect(await readBoard(() => { throw new CommandFailure('gh exited 1: connection reset', 'other', true); })).toBe(`GitHub Project read failed: Error: gh exited 1: connection reset. ${RETRY}`);
});

test('the refusal is decided before the access expression, and a supplied match chooses the wait whatever the caught text', () => {
    expect(boardReadFailure(new Error('Forbidden (HTTP 403)'), 'You have exceeded a secondary rate limit')).toBe(`GitHub Project read failed: Error: Forbidden (HTTP 403): You have exceeded a secondary rate limit. ${WAIT}`);
    expect(boardReadFailure(new Error('query failed'), 'query failed')).toBe(`GitHub Project read failed: Error: query failed. ${WAIT}`);
    expect(boardReadFailure('plain text')).toBe(`GitHub Project read failed: plain text. ${RETRY}`);
});
