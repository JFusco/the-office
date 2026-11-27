import { expect, test } from 'vitest';
import { GitHubCalls } from '../../../server/github/github-calls';
import { captureGitHubFailures, stopFailure, type CapturedFailure } from '../../../server/github/refusal-capture';
import { withWriteCredential } from '../../../server/github/identity/write-credential-scope';
import { appCredential } from '../../../server/github/identity/child-credentials';
import type { Runner } from '../../../server/github/call-scope';

const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET = T0 / 1000 + 1800;
const iso = (ms: number) => new Date(ms).toISOString();
const PRIMARY = 'gh exited 1: gh: API rate limit exceeded for user ID 1. (HTTP 403)';
const SECONDARY = 'gh exited 1: gh: You have exceeded a secondary rate limit. (HTTP 403)';
const limits = (remaining: number, reset = RESET) => JSON.stringify({ resources: { core: { limit: 5000, used: 5000 - remaining, remaining, reset }, graphql: { limit: 5000, used: 10, remaining: 4990, reset } } });

/** The Office's real metered runner, samples and governor over a simulated `gh`: a block is printed, then the error is thrown. */
function office(answer: (args: string[]) => { block?: string; error?: Error; stdout?: string }, probe = async () => limits(4000)) {
    let now = T0;
    const probes: string[][] = [];
    const raw: Runner = async (_program, args, options = {}) => {
        options.onSpawn?.(7);
        if (args[1] === 'rate_limit') { probes.push(args); return probe(); }
        const { block, error, stdout } = answer(args);
        if (block) options.onOutput?.('stdout', block);
        if (error) throw error;
        if (stdout) options.onOutput?.('stdout', stdout);
        return stdout ?? '{}';
    };
    const calls = new GitHubCalls(raw, '', () => now);
    const told: { message: string; evidence: any }[] = [];
    const run = (args: string[], readOnly = true) => calls.bind(() => calls.run('gh', args, { readOnly, onGitHubRefusal: (message, evidence) => { told.push({ message, evidence }); } })).catch((error: Error) => error);
    /** Runs `work` in a capture and returns what it captured for a stop whose text is `stopText`. */
    const captured = async (work: () => Promise<unknown>, stopText: string) => captureGitHubFailures(async () => { await work(); return stopFailure(stopText); });
    return { calls, told, run, captured, probes, at: (seconds: number) => { now = T0 + seconds * 1000; } };
}

test('a refusal\'s Retry-After, in seconds or as an HTTP date, is the deadline the evidence carries', async () => {
    const seconds = office(() => ({ block: 'HTTP/2.0 403 Forbidden\r\nRetry-After: 90\r\n\r\n{}', error: new Error(SECONDARY) }));
    const a = await seconds.captured(() => seconds.run(['api', '-i', 'repos/JFusco/brain/pulls']), `Error: ${SECONDARY}`);
    expect(a?.refusal).toMatchObject({ principal: 'operator', resource: 'core', deadline: iso(T0 + 90_000), secondary: true, retryAfterMs: 90_000, readOnly: true });
    expect(seconds.told[0]).toMatchObject({ message: SECONDARY, evidence: { deadline: iso(T0 + 90_000) } });
    // An HTTP date is read against the wall clock, to the second.
    const date = new Date(Date.now() + 300_000).toUTCString();
    const dated = office(() => ({ block: `HTTP/2.0 429 Too Many Requests\r\nRetry-After: ${date}\r\n\r\n{}`, error: new Error(SECONDARY) }));
    const b = await dated.captured(() => dated.run(['api', '-i', 'repos/JFusco/brain/pulls']), SECONDARY);
    expect(Math.abs(Date.parse(b!.refusal!.deadline!) - (T0 + 300_000))).toBeLessThan(2000);
    expect(b?.refusal?.secondary).toBe(true);
});

test('an exhausted resource\'s reset is the deadline; a primary refusal with none stated uses a live spent window, else the shared probe\'s late reading', async () => {
    const zero = office(() => ({ block: `HTTP/2.0 403 Forbidden\r\nX-RateLimit-Resource: core\r\nX-RateLimit-Limit: 5000\r\nX-RateLimit-Used: 5000\r\nX-RateLimit-Remaining: 0\r\nX-RateLimit-Reset: ${RESET}\r\n\r\n{}`, error: new Error(PRIMARY) }));
    expect((await zero.captured(() => zero.run(['api', '-i', 'repos/JFusco/brain/pulls']), PRIMARY))?.refusal).toMatchObject({ deadline: iso(RESET * 1000), secondary: false });
    expect(zero.probes).toEqual([]);
    // No window stated: the governor's minute now, and the probe's spent window once it answers.
    const late = office(() => ({ error: new Error(PRIMARY) }), async () => limits(0));
    const c = await late.captured(() => late.run(['api', 'repos/JFusco/brain/pulls']), PRIMARY);
    expect(c?.refusal?.deadline).toBe(iso(T0 + 60_000));
    expect(await c?.refusal?.late).toBe(iso(RESET * 1000));
    expect(late.probes).toHaveLength(1);
});

test('a GraphQL refusal in an HTTP 200 envelope is a refusal of the graphql resource; operator REST and installation GraphQL are told apart', async () => {
    const f = office(args => args[1] === 'graphql' ? { stdout: JSON.stringify({ data: null, errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded for installation ID 9.' }] }) } : { error: new Error(PRIMARY) });
    const app = appCredential(77, 'scoped-token');
    const graphql = await f.captured(() => withWriteCredential(app, () => f.run(['api', 'graphql', '--input', '-'])), 'Error: API rate limit exceeded for installation ID 9.');
    expect(graphql?.refusal).toMatchObject({ principal: 'app:77', resource: 'graphql', text: 'API rate limit exceeded for installation ID 9.' });
    const rest = await f.captured(() => f.run(['api', 'repos/JFusco/brain/pulls']), PRIMARY);
    expect(rest?.refusal).toMatchObject({ principal: 'operator', resource: 'core' });
    // Each principal has its own hold.
    expect(f.calls.governor.hold(['core'], 'operator')).toBeDefined();
    expect(f.calls.governor.hold(['graphql'], 'app:77')).toBeDefined();
});

test('a bare 429, a permission 403 and a write are kept as failures without refusal evidence; a successful inner retry supersedes a failure', async () => {
    let fail = true;
    const f = office(args => args[1].endsWith('pulls/9') ? (fail ? { error: new Error('gh exited 1: gh: HTTP 429') } : { stdout: '{}' })
        : args[1].endsWith('pulls/8') ? { error: new Error('gh exited 1: gh: Resource not accessible by integration (HTTP 403)') } : { error: new Error(PRIMARY) });
    let bare: CapturedFailure | undefined, permission: CapturedFailure | undefined, write: CapturedFailure | undefined, answered: CapturedFailure | undefined;
    await captureGitHubFailures(async () => {
        await f.run(['api', 'repos/JFusco/brain/pulls/9']);
        bare = stopFailure('Error: gh exited 1: gh: HTTP 429');
        await f.run(['api', 'repos/JFusco/brain/pulls/8']);
        permission = stopFailure('Resource not accessible by integration');
        await f.run(['api', 'repos/JFusco/brain/pulls/7', '--method', 'PATCH'], false);
        write = stopFailure(PRIMARY);
        fail = false;
        await f.run(['api', 'repos/JFusco/brain/pulls/9']);
        answered = stopFailure('Error: gh exited 1: gh: HTTP 429');
    });
    expect(bare).toMatchObject({ readOnly: true, text: 'gh exited 1: gh: HTTP 429' });
    expect(bare?.refusal).toBeUndefined();
    expect(permission?.refusal).toBeUndefined();
    expect(write).toMatchObject({ readOnly: false, refusal: { readOnly: false } });
    expect(answered).toBeUndefined();
    // Outside a capture nothing is kept, and the callback still hears only the text a text-only caller reads.
    expect(stopFailure(PRIMARY)).toBeUndefined();
});

test('a proactive reserve hold is not a refusal: a low reading alone gives no evidence', async () => {
    const f = office(() => ({ stdout: `HTTP/2.0 200 OK\r\nX-RateLimit-Resource: core\r\nX-RateLimit-Limit: 5000\r\nX-RateLimit-Used: 4990\r\nX-RateLimit-Remaining: 10\r\nX-RateLimit-Reset: ${RESET}\r\n\r\n{}` }));
    const captured = await f.captured(() => f.run(['api', '-i', 'repos/JFusco/brain/pulls']), 'anything');
    expect(f.calls.governor.hold()).toBeDefined();
    expect(captured).toBeUndefined();
    expect(f.told).toEqual([]);
});
