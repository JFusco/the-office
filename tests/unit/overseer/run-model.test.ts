import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { admit, type ReservationRow } from '../../../server/overseer/budget-ledger';
import { claudeGeneration } from '../../../server/overseer/provider-auth/claude-handoff';
import { readCodexEnvelope, runAuthPath } from '../../../server/overseer/provider-auth/codex-handoff';
import { readStatus, statusPath, stopGeneration, updateStatus } from '../../../server/overseer/provider-auth/profile-status';
import { budgetRequest } from '../../../server/overseer/budget-policy';
import type { ProviderCall } from '../../../server/overseer/stages/triage';
import { gatedBudgeted } from '../../../server/overseer/run-model';
import { collectSecondOpinion } from '../../../server/overseer/stages/second-opinion';
import { collectTriage } from '../../../server/overseer/stages/triage';
import type { RunnerPaths } from '../../../server/overseer/config';
import { CLAUDE_TOKEN, codexAuth } from './provider-auth/provider-world';
import { CLAUDE_MODEL, readerWorld } from './run-model-world';
import { defect, frozen } from './triage-world';

type FsObservers = {
    opened?: (path: unknown, fd: number, flags: unknown) => void;
    read?: (path: unknown) => void;
    rename?: (destination: unknown) => void;
    unlink?: (path: unknown) => void;
    sync?: (fd: number) => void;
};
const observers = vi.hoisted(() => ({ current: {} as FsObservers }));
vi.mock('node:fs', async importOriginal => {
    const fs = await importOriginal<typeof import('node:fs')>();
    return {
        ...fs,
        openSync: ((...args: Parameters<typeof fs.openSync>) => {
            const fd = fs.openSync(...args);
            observers.current.opened?.(args[0], fd, args[1]);
            return fd;
        }) as typeof fs.openSync,
        readFileSync: ((...args: Parameters<typeof fs.readFileSync>) => {
            observers.current.read?.(args[0]);
            return fs.readFileSync(...args);
        }) as typeof fs.readFileSync,
        renameSync: ((from, to) => { observers.current.rename?.(to); fs.renameSync(from, to); }) as typeof fs.renameSync,
        unlinkSync: (path => { observers.current.unlink?.(path); fs.unlinkSync(path); }) as typeof fs.unlinkSync,
        fsyncSync: (fd => { observers.current.sync?.(fd); fs.fsyncSync(fd); }) as typeof fs.fsyncSync,
    };
});
afterEach(() => { observers.current = {}; vi.unstubAllEnvs(); vi.useRealTimers(); });

const now = () => new Date('2026-11-27T17:00:00.000Z');
const rows = (paths: RunnerPaths): ReservationRow[] => {
    if (!existsSync(paths.budgetDb)) return [];
    const db = new DatabaseSync(paths.budgetDb, { readOnly: true });
    try { return db.prepare('SELECT * FROM reservations ORDER BY rowid').all() as unknown as ReservationRow[]; } finally { db.close(); }
};
const allocations = (paths: RunnerPaths) => existsSync(paths.runs) ? readdirSync(paths.runs).length : 0;

test('the shipped gate refuses first, before the runtime, any allocation, the lock, a sign-in or the ledger', async () => {
    const world = readerWorld(), runtime = vi.fn(world.setup().runtime), before = allocations(world.paths);
    try {
        const { gate: _gate, ...shipped } = world.setup({ runtime });
        const opinion = await collectTriage({ budgeted: gatedBudgeted(shipped), round: 1, provider: 'claude', input: frozen() });
        expect(opinion).toMatchObject({ status: 'unavailable', reason: 'the call was refused before admission: dispatch-gate-closed' });
        expect(runtime).not.toHaveBeenCalled();
        expect(allocations(world.paths)).toBe(before);
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
    } finally { world.lock.release(); }
});

test('each later gate refuses on its own, in order, with nothing admitted and nothing launched', async () => {
    const cases: [string, (world: ReturnType<typeof readerWorld>) => Parameters<ReturnType<typeof readerWorld>['setup']>[0], 'claude' | 'codex', string][] = [
        ['runtime', () => ({ runtime: () => ({ status: 'unavailable', reason: 'fixture' }) }), 'claude', 'runtime-unavailable'],
        ['receipts', world => ({ receipts: { ...world.receipts, inner: {} } }), 'claude', 'receipts-unqualified'],
        ['overlap', world => ({ interactiveRoots: [world.paths.root] }), 'claude', 'storage-overlap'],
        ['preparation', world => { const id = readdirSync(world.paths.runs)[0]; return { newId: () => id }; }, 'claude', 'preparation-failed'],
        ['eligibility', world => ({ receipts: { ...world.receipts, inner: { ...world.receipts.inner, 'claude-reader': { ...world.receipts.inner['claude-reader'], identity: { ...world.receipts.inner['claude-reader'].identity, provider: { ...world.receipts.inner['claude-reader'].identity.provider, argv: ['-p'] } } } } } }), 'claude', 'profile-ineligible'],
        ['ownership', world => ({ proof: { ...world.proof, owner: { ...world.proof.owner, pass: 'another-pass' } } }), 'codex', 'ownership-unproven'],
        ['stopped', world => { stopGeneration(world.paths, world.proof, 'claude', claudeGeneration(CLAUDE_TOKEN), 'sign-in-rejected'); return {}; }, 'claude', 'profile-stopped'],
        ['sign-in', world => { writeFileSync(world.where.claudeToken, 'two words\n'); return {}; }, 'claude', 'sign-in-invalid'],
    ];
    for (const [name, change, provider, reason] of cases) {
        const world = readerWorld();
        try {
            const setup = world.setup(change(world));
            const opinion = await collectTriage({ budgeted: gatedBudgeted(setup), round: 1, provider, input: frozen() });
            expect(opinion, name).toMatchObject({ status: 'unavailable', reason: `the call was refused before admission: ${reason}` });
            expect(rows(world.paths), name).toEqual([]);
            expect(world.calls, name).toEqual([]);
            expect(existsSync(join(world.paths.runs)) ? readdirSync(world.paths.runs).filter(id => existsSync(runAuthPath(join(world.paths.runs, id)))) : [], name).toEqual([]);
        } finally { world.lock.release(); }
    }
});

test('triage and the blind opinion run end to end through the caller-held lock, each with only its own sign-in and nothing ambient', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ambient'); vi.stubEnv('OPENAI_API_KEY', 'sk-ambient'); vi.stubEnv('CODEX_HOME', '/ambient/codex'); vi.stubEnv('CLAUDE_CONFIG_DIR', '/ambient/claude');
    const world = readerWorld(), environment = structuredClone(process.env);
    const interactiveState = () => ({
        entries: readdirSync(world.home, { recursive: true }).sort(),
        bytes: Object.fromEntries(Object.keys(world.sentinels).map(path => [path, readFileSync(path)])),
    });
    const before = interactiveState();
    const opened: string[] = [];
    const observe = (path: unknown) => { if (typeof path === 'string') opened.push(path); };
    try {
        const budgeted = gatedBudgeted(world.setup({ ledger: { now } })), input = frozen();
        observers.current = { opened: observe, read: observe };
        const first = await collectTriage({ budgeted, round: 1, provider: 'claude', input });
        observers.current = {};
        expect(opened).toContain(world.where.claudeToken);
        expect(opened.filter(path => path.startsWith(world.home + '/'))).toEqual([]);
        expect(interactiveState()).toEqual(before);
        expect(first).toMatchObject({ status: 'valid', envelope: { provider: 'claude', model: CLAUDE_MODEL, session: 'claude-session-1' } });
        opened.length = 0;
        observers.current = { opened: observe, read: observe };
        const second = await collectSecondOpinion({ budgeted, input, first: { provider: first.envelope.provider, inputIdentity: first.envelope.inputIdentity } });
        observers.current = {};
        expect(opened).toContain(world.where.codexAuth);
        expect(opened.filter(path => path.startsWith(world.home + '/'))).toEqual([]);
        expect(interactiveState()).toEqual(before);
        expect(second).toMatchObject({ status: 'valid', envelope: { provider: 'codex', session: 'codex-thread-2' } });
        const [claude, codex] = world.calls;
        expect(claude.argv.slice(-world.selections.claude.argv.length)).toEqual([...world.selections.claude.argv]);
        expect(claude.input).toBe(codex.input);
        expect(claude.env.CLAUDE_CODE_OAUTH_TOKEN).toBe(CLAUDE_TOKEN);
        expect(codex.env).not.toHaveProperty('CLAUDE_CODE_OAUTH_TOKEN');
        for (const call of [claude, codex]) {
            for (const name of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']) expect(call.env).not.toHaveProperty(name);
            expect(call.env.CODEX_HOME ?? call.env.CLAUDE_CONFIG_DIR).toContain(world.paths.runs);
        }
        expect(rows(world.paths).map(row => [row.stage, row.status])).toEqual([['triage', 'settled'], ['second-opinion', 'settled']]);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null, stops: { claude: [], codex: [] } } });
        expect(readdirSync(world.paths.runs).filter(id => existsSync(runAuthPath(join(world.paths.runs, id))))).toEqual([]);
        expect(process.env).toEqual(environment);
    } finally { world.lock.release(); }
});

test('a verified Codex refresh is published back; a rejected refresh stops the generation with no write-back', async () => {
    const refreshed = readerWorld({ codex: 'refresh' });
    try {
        const opinion = await collectTriage({ budgeted: gatedBudgeted(refreshed.setup({ ledger: { now } })), round: 1, provider: 'codex', input: frozen() });
        expect(opinion.status).toBe('valid');
        expect(readFileSync(refreshed.where.codexAuth, 'utf8')).toContain('refresh-rotated-');
    } finally { refreshed.lock.release(); }
    const rejected = readerWorld({ codex: 'invalid-grant' });
    try {
        const canonical = readFileSync(rejected.where.codexAuth, 'utf8'), budgeted = gatedBudgeted(rejected.setup({ ledger: { now } }));
        expect((await collectTriage({ budgeted, round: 1, provider: 'codex', input: frozen() })).status).toBe('unavailable');
        expect(readFileSync(rejected.where.codexAuth, 'utf8')).toBe(canonical);
        expect(readStatus(rejected.paths)).toMatchObject({ ok: true, status: { active: null, stops: { codex: [{ reason: 'refresh-rejected' }] } } });
        expect(await collectTriage({ budgeted, round: 2, provider: 'codex', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: profile-stopped' });
    } finally { rejected.lock.release(); }
});

test('an expired or revoked Claude token stops its profile with no refresh attempt; quoted errors leave it usable', async () => {
    const rejected = readerWorld({ claude: 'unauthorized' });
    try {
        const budgeted = gatedBudgeted(rejected.setup({ ledger: { now } }));
        expect((await collectTriage({ budgeted, round: 1, provider: 'claude', input: frozen() })).status).toBe('unavailable');
        expect(rejected.endpoint.refreshAttempts.claude).toBe(0);
        expect(readStatus(rejected.paths)).toMatchObject({ ok: true, status: { stops: { claude: [{ generation: claudeGeneration(CLAUDE_TOKEN), reason: 'sign-in-rejected' }] } } });
        expect(await collectTriage({ budgeted, round: 2, provider: 'claude', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: profile-stopped' });
        // A new enrollment is a new generation and starts clear.
        writeFileSync(rejected.where.claudeToken, `${CLAUDE_TOKEN}-renewed\n`);
        expect((await collectSecondOpinion({ budgeted, input: frozen(), first: { provider: 'codex', inputIdentity: frozen().identity } })).status).not.toMatch(/gate/);
    } finally { rejected.lock.release(); }
    const quoted = readerWorld({ claude: 'quotes-401' });
    try {
        expect((await collectTriage({ budgeted: gatedBudgeted(quoted.setup({ ledger: { now } })), round: 1, provider: 'claude', input: frozen() })).status).toBe('valid');
        expect(readStatus(quoted.paths)).toMatchObject({ ok: true, status: { stops: { claude: [] } } });
    } finally { quoted.lock.release(); }
});

test('an executor that refuses before spawning releases the reservation, and the same round is admitted again', async () => {
    const world = readerWorld({ codex: 'never-spawns' });
    try {
        const budgeted = gatedBudgeted(world.setup({ ledger: { now } }));
        expect(await collectTriage({ budgeted, round: 1, provider: 'codex', input: frozen() })).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('refused before launch and its reservation released') });
        expect(rows(world.paths)).toEqual([]);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
        world.behaviour.codex = 'answer';
        expect((await collectTriage({ budgeted, round: 1, provider: 'codex', input: frozen() })).status).toBe('valid');
    } finally { world.lock.release(); }
});

test('a gate that closes after admission is caught before dispatch, released, and spends nothing', async () => {
    const world = readerWorld();
    try {
        let open = true;
        const budgeted = gatedBudgeted(world.setup({ ledger: { now }, gate: () => { const was = open; open = false; return { open: was, reason: 'fixture' }; } }));
        expect(await collectTriage({ budgeted, round: 1, provider: 'claude', input: frozen() })).toMatchObject({ reason: expect.stringContaining('the dispatch gate closed') });
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
    } finally { world.lock.release(); }
});

test('a second session, another model or an error with a charge suppresses the verdict but settles what it cost', async () => {
    for (const claude of ['second-session', 'other-model', 'error-with-cost'] as const) {
        const world = readerWorld({ claude });
        try {
            const opinion = await collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now } })), round: 1, provider: 'claude', input: frozen() });
            expect(opinion.status, claude).toBe('unavailable');
            if (claude === 'second-session') expect(opinion, claude).toMatchObject({ reason: 'the call failed: the provider reported a second, different session' });
            expect(rows(world.paths)[0], claude).toMatchObject({ final: 1, receipt_total: 500_000 });
        } finally { world.lock.release(); }
    }
    for (const codex of ['extra-thread', 'other-model'] as const) {
        const world = readerWorld({ codex });
        try {
            const opinion = await collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now } })), round: 1, provider: 'codex', input: frozen() });
            expect(opinion.status, codex).toBe('unavailable');
            // A coverage gap keeps the hold: a readable parent alone cannot finalize the charge.
            if (codex === 'extra-thread') expect(rows(world.paths)[0], codex).toMatchObject({ final: 0, status: 'retained' });
        } finally { world.lock.release(); }
    }
});

test('a session the ledger cannot bind, raised from an output callback, fails the call without escaping it', async () => {
    const world = readerWorld();
    try {
        let writes = 0;
        const hooks = { afterBegin: () => { if (++writes === 2) throw new Error('bind write failed'); } };
        const opinion = await collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now, hooks } })), round: 1, provider: 'claude', input: frozen() });
        // The fault is kept from the output callback and reported, not lost to a later check.
        expect(opinion).toMatchObject({ status: 'unavailable', reason: 'the call failed: the launch session could not be bound' });
        expect(world.calls).toHaveLength(1);
    } finally { world.lock.release(); }
});

test('a Codex hand-off this pass still holds excludes a second Codex copy but not a Claude call', async () => {
    const world = readerWorld();
    try {
        updateStatus(world.paths, world.proof, status => {
            status.active = { provider: 'codex', owner: world.proof.owner, run: '3f2a9c4e-1b7d-4e8a-9c0f-5d6e7a8b9c01', generation: 'a'.repeat(64), sourceDigest: 'b'.repeat(64), copiedDigest: 'b'.repeat(64), phase: 'launched', group: 4242 };
        });
        const budgeted = gatedBudgeted(world.setup({ ledger: { now } }));
        expect(await collectTriage({ budgeted, round: 1, provider: 'codex', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: handoff-active' });
        expect((await collectTriage({ budgeted, round: 1, provider: 'claude', input: frozen() })).status).toBe('valid');
        expect(codexAuth()).toBe(readFileSync(world.where.codexAuth, 'utf8'));
    } finally { world.lock.release(); }
});

test('a timed-out call hands its completion to the lock holder before it returns, and its Codex copy is retired when that completes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const world = readerWorld({ codex: 'hang' });
    try {
        const pending = collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now } })), round: 1, provider: 'codex', input: frozen() });
        await vi.advanceTimersByTimeAsync(31 * 60_000);
        const opinion = await pending;
        expect(opinion).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('timeout') });
        expect(world.late).toHaveLength(1);
        await Promise.all(world.late);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
        expect(readdirSync(world.paths.runs).filter(id => existsSync(runAuthPath(join(world.paths.runs, id))))).toEqual([]);
        expect(rows(world.paths)[0]).toMatchObject({ status: 'retained', evidence_id: expect.stringMatching(/^codex-thread-/) });
    } finally { world.lock.release(); }
});

/** Calls the prepared invocation through a test's own use, after `meddle` changes something between admission and dispatch. */
async function meddled(world: ReturnType<typeof readerWorld>, provider: 'claude' | 'codex', meddle: () => void, override: Partial<ProviderCall> = {}) {
    const setup = world.setup({ ledger: { now } }), input = frozen();
    return { setup, outcome: await gatedBudgeted(setup)({ request: budgetRequest('inc-0000000000000001', 'triage', 1), provider, input }, async (run, invoke) => {
        meddle();
        const answer = await invoke({ provider, prompt: 'p', reservation: run.reservation, totalTimeoutMs: run.totalTimeoutMs, inactivityTimeoutMs: run.inactivityTimeoutMs, signal: run.signal, activity: run.activity, onSession: session => run.bindSession(session), ...override });
        return answer.receipt;
    }) };
}

test('each recheck before dispatch refuses on its own, releases the reservation and launches nothing', async () => {
    const cases: [string, 'claude' | 'codex', (world: ReturnType<typeof readerWorld>, setup: () => ReturnType<ReturnType<typeof readerWorld>['setup']>) => void, Partial<ProviderCall>, string][] = [
        ['another reservation', 'claude', () => {}, { reservation: '00000000-0000-4000-8000-000000000000' }, "the call is not this allocation's"],
        ['another provider', 'claude', () => {}, { provider: 'codex' }, "the call is not this allocation's"],
        ['the lock taken', 'claude', world => writeFileSync(world.paths.lock, JSON.stringify({ ...world.proof.owner, pass: 'someone-else' })), {}, 'the caller no longer holds the pass lock'],
        ['the receipt withdrawn', 'claude', world => { delete (world.receipts.inner as Record<string, unknown>)['claude-reader']; }, {}, 'the profile is no longer eligible'],
        ['the token replaced', 'claude', world => writeFileSync(world.where.claudeToken, `${CLAUDE_TOKEN}-replaced\n`), {}, 'the Claude sign-in is no longer eligible'],
        ['the hand-off cleared', 'codex', world => updateStatus(world.paths, world.proof, status => { status.active = null; }), {}, 'the Codex sign-in is no longer eligible'],
    ];
    for (const [name, provider, change, override, reason] of cases) {
        const world = readerWorld();
        try {
            const { outcome } = await meddled(world, provider, () => change(world, () => world.setup()), override);
            expect(outcome, name).toMatchObject({ status: 'not-dispatched', error: { message: reason } });
            expect(rows(world.paths), name).toEqual([]);
            expect(world.calls, name).toEqual([]);
            const remaining = readdirSync(world.paths.runs).filter(id => existsSync(runAuthPath(join(world.paths.runs, id))));
            expect(remaining, name).toHaveLength(name === 'the hand-off cleared' ? 1 : 0);
        } finally { world.lock.release(); }
    }
});

test('an unrecoverable hand-off left by a dead pass refuses a Claude call too, and a stopped or invalid Codex login refuses before any copy', async () => {
    const stale = readerWorld();
    try {
        updateStatus(stale.paths, stale.proof, status => {
            status.active = { provider: 'codex', owner: { ...stale.proof.owner, pass: 'pass-dead' }, run: '3f2a9c4e-1b7d-4e8a-9c0f-5d6e7a8b9c01', generation: 'a'.repeat(64), sourceDigest: 'b'.repeat(64), copiedDigest: 'b'.repeat(64), phase: 'launching', group: null };
        });
        expect(await collectTriage({ budgeted: gatedBudgeted(stale.setup({ ledger: { now } })), round: 1, provider: 'claude', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: handoff-unrecoverable' });
    } finally { stale.lock.release(); }
    const stopped = readerWorld();
    try {
        const { readCodexEnvelope } = await import('../../../server/overseer/provider-auth/codex-handoff');
        const seen = readCodexEnvelope(readFileSync(stopped.where.codexAuth));
        if (!seen.ok) throw new Error(seen.reason);
        stopGeneration(stopped.paths, stopped.proof, 'codex', seen.generation, 'refresh-rejected');
        expect(await collectTriage({ budgeted: gatedBudgeted(stopped.setup({ ledger: { now } })), round: 1, provider: 'codex', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: profile-stopped' });
        writeFileSync(stopped.where.codexAuth, '{"auth_mode":"apikey"}');
        expect(await collectTriage({ budgeted: gatedBudgeted(stopped.setup({ ledger: { now } })), round: 1, provider: 'codex', input: frozen() })).toMatchObject({ reason: 'the call was refused before admission: sign-in-invalid' });
        expect(readdirSync(stopped.paths.runs).filter(id => existsSync(runAuthPath(join(stopped.paths.runs, id))))).toEqual([]);
    } finally { stopped.lock.release(); }
});

test('a live or uncertain group holds the claim until its original invocation confirms late exit', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const world = readerWorld({ codex: 'refresh' });
    let state: 'alive' | 'uncertain' | 'absent' = 'alive';
    try {
        const before = readFileSync(world.where.codexAuth, 'utf8');
        const pending = collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now }, groupState: () => state })), round: 1, provider: 'codex', input: frozen() });
        await vi.advanceTimersByTimeAsync(1);
        expect(rows(world.paths)[0]).toMatchObject({ status: 'outstanding', final: 0, receipt_total: null });
        state = 'uncertain';
        await vi.advanceTimersByTimeAsync(budgetRequest('inc-0000000000000001', 'triage', 1).inactivityTimeoutMs + 1);
        expect(await pending).toMatchObject({ status: 'unavailable', reason: expect.stringContaining('timeout') });
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { phase: 'launched', group: 999_999 } } });
        expect(rows(world.paths)[0]).toMatchObject({ final: 0, receipt_total: null });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(before);
        expect(world.late).toHaveLength(1);
        state = 'absent';
        await Promise.all(world.late);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
        expect(rows(world.paths)).toMatchObject([{ final: 1, receipt_total: expect.any(Number) }]);
        expect(readFileSync(world.where.codexAuth, 'utf8')).toContain('refresh-rotated-');
    } finally { state = 'absent'; world.lock.release(); }
});

test('authentication evidence from another provider, run or generation stops nothing', async () => {
    const foreign = readerWorld();
    try {
        const generation = claudeGeneration(CLAUDE_TOKEN);
        const endpoint = foreign.endpoint, original = endpoint.authentication.bind(endpoint);
        endpoint.authentication = run => [...original(run),
            { provider: 'codex', run, generation, kind: 'codex-invalid-grant' },
            { provider: 'claude', run: 'another-run', generation, kind: 'claude-unauthorized' },
            { provider: 'claude', run, generation: 'f'.repeat(64), kind: 'claude-unauthorized' }];
        expect((await collectTriage({ budgeted: gatedBudgeted(foreign.setup({ ledger: { now } })), round: 1, provider: 'claude', input: frozen() })).status).toBe('valid');
        expect(readStatus(foreign.paths)).toMatchObject({ ok: true, status: { stops: { claude: [], codex: [] } } });
    } finally { foreign.lock.release(); }
});

test('a reader that never reports its start fails for that reason', async () => {
    const world = readerWorld({ claude: 'no-start' });
    try {
        expect(await collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now } })), round: 1, provider: 'claude', input: frozen() }))
            .toMatchObject({ status: 'unavailable', reason: 'the call failed: the reader reported no session' });
    } finally { world.lock.release(); }
});

const triage = (world: ReturnType<typeof readerWorld>, provider: 'claude' | 'codex', overrides: Parameters<typeof world.setup>[0] = {}) =>
    collectTriage({ budgeted: gatedBudgeted(world.setup({ ledger: { now }, ...overrides })), round: 1, provider, input: frozen() });

test('a dead pass with an unremovable staged copy gives a closed refusal before admission', async () => {
    const world = readerWorld(), run = world.allocate();
    try {
        mkdirSync(runAuthPath(run.root));
        updateStatus(world.paths, world.proof, status => {
            status.active = { provider: 'codex', owner: { ...world.proof.owner, pass: 'dead' }, run: run.id, generation: 'a'.repeat(64), sourceDigest: 'b'.repeat(64), copiedDigest: 'b'.repeat(64), phase: 'staged', group: null };
        });
        expect(await triage(world, 'claude')).toMatchObject({ reason: 'the call was refused before admission: handoff-unrecoverable' });
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { run: run.id } } });
    } finally { world.lock.release(); }
});

test('a failed launch-intent write releases and retires while the pass still owns the claim', async () => {
    const world = readerWorld();
    let writes = 0;
    observers.current = { rename: path => {
        if (path === statusPath(world.paths) && ++writes === 2) throw new Error('synthetic launch-intent write failure');
    } };
    try {
        expect(await triage(world, 'codex')).toMatchObject({ reason: expect.stringContaining('reservation released: the launch intent could not be recorded') });
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
        expect(readdirSync(world.paths.runs).some(id => existsSync(runAuthPath(join(world.paths.runs, id))))).toBe(false);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
    } finally { world.lock.release(); }
});

test('post-exit directory changes suppress verdict and promotion while allowing safe retirement', async () => {
    const world = readerWorld({ codex: 'refresh' }), execute = world.setup().executor;
    const canonical = readFileSync(world.where.codexAuth, 'utf8');
    try {
        const opinion = await triage(world, 'codex', { executor: async (...args) => {
            const stdout = await execute(...args);
            chmodSync(world.calls[0].env.CODEX_HOME, 0o755);
            return stdout;
        } });
        expect(opinion).toMatchObject({ reason: 'the call failed: the run folders changed during the run' });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(canonical);
        expect(existsSync(join(world.calls[0].env.CODEX_HOME, 'auth.json'))).toBe(false);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
    } finally { world.lock.release(); }
});

test('an indeterminate Codex launch fences the credential and a reported spawn overrides a refusal', async () => {
    for (const spawned of [false, true]) {
        const world = readerWorld();
        try {
            const opinion = await triage(world, 'codex', { executor: async (_program, _args, options) => {
                if (spawned) options?.onSpawn?.(999_999);
                throw Object.assign(new Error('private diagnostic'), { dispatched: !spawned });
            } });
            expect(opinion.status).toBe('unavailable');
            expect(rows(world.paths)).toMatchObject([{ final: 0, receipt_total: null }]);
            const status = readStatus(world.paths);
            if (!status.ok) throw new Error(status.reason);
            if (spawned) expect(status.status.active).toBeNull();
            else {
                expect(status.status.active).toMatchObject({ phase: 'launching', group: null });
                expect(existsSync(runAuthPath(join(world.paths.runs, status.status.active!.run)))).toBe(true);
            }
        } finally { world.lock.release(); }
    }
});

test('executor rejection retains only the matching receipt, including after the deadline', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    for (const sample of ['on-time', 'late', 'foreign', 'missing', 'codex-rollout'] as const) {
        const world = readerWorld(), execute = world.setup().executor;
        const marker = 'synthetic-private-diagnostic';
        let rejectLate!: () => void;
        try {
            const pending = triage(world, sample === 'codex-rollout' ? 'codex' : 'claude', { executor: async (program, args, options) => {
                await execute(program, args, {
                    ...options,
                    onOutput: sample === 'missing' || sample === 'foreign' ? undefined : options?.onOutput,
                });
                if (sample === 'foreign' || sample === 'missing') {
                    options?.onOutput?.('stdout', '{"type":"system","subtype":"init","session_id":"bound"}\n');
                    if (sample === 'foreign') options?.onOutput?.('stdout', '{"type":"result","session_id":"other","total_cost_usd":3}\n');
                }
                if (sample === 'late') await new Promise<void>(resolve => { rejectLate = resolve; });
                throw new Error(marker);
            } });
            if (sample === 'late') await vi.advanceTimersByTimeAsync(budgetRequest('inc-0000000000000001', 'triage', 1).inactivityTimeoutMs + 1);
            const opinion = await pending;
            expect(opinion.status).toBe('unavailable');
            expect(JSON.stringify(opinion)).not.toContain(marker);
            if (sample === 'late') {
                expect(rows(world.paths)[0].final).toBe(0);
                rejectLate();
                await Promise.all(world.late);
            }
            const final = sample !== 'missing' && sample !== 'foreign';
            expect(rows(world.paths)).toMatchObject([{ final: final ? 1 : 0, receipt_total: final ? expect.any(Number) : null }]);
            if (sample === 'on-time' || sample === 'late') expect(rows(world.paths)[0].receipt_total).toBe(500_000);
        } finally { world.lock.release(); }
    }
});

test('generation stops and a replacement enrollment prevent dispatch after admission', async () => {
    for (const provider of ['claude', 'codex'] as const) {
        const world = readerWorld();
        try {
            const canonical = readCodexEnvelope(readFileSync(world.where.codexAuth));
            if (!canonical.ok) throw new Error(canonical.reason);
            const { outcome } = await meddled(world, provider, () =>
                stopGeneration(world.paths, world.proof, provider, provider === 'claude' ? claudeGeneration(CLAUDE_TOKEN) : canonical.generation, 'sign-in-rejected'));
            expect(outcome.status).toBe('not-dispatched');
            expect(rows(world.paths)).toEqual([]);
            expect(world.calls).toEqual([]);
        } finally { world.lock.release(); }
    }
    const world = readerWorld(), replacement = codexAuth({ loginOwner: 'other-enrollment' });
    try {
        const { outcome } = await meddled(world, 'codex', () => writeFileSync(world.where.codexAuth, replacement));
        expect(outcome.status).toBe('not-dispatched');
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(replacement);
    } finally { world.lock.release(); }
});

test('retirement validates its parent and syncs removal before clearing the durable claim', async () => {
    for (const mode of ['ordered', 'sync-fault', 'unsafe-parent'] as const) {
        const world = readerWorld(), execute = world.setup().executor;
        const events: string[] = [];
        let credential: string, directory: number | undefined;
        try {
            const opinion = await triage(world, 'codex', { executor: async (...args) => {
                const stdout = await execute(...args);
                const parent = world.calls[0].env.CODEX_HOME;
                credential = join(parent, 'auth.json');
                if (mode === 'unsafe-parent') chmodSync(parent, 0o777);
                observers.current = {
                    opened: (path, fd) => { if (path === parent) directory = fd; },
                    unlink: path => { if (path === credential) events.push('unlink'); },
                    sync: fd => {
                        if (fd !== directory) return;
                        events.push('sync');
                        directory = undefined;
                        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { phase: 'retiring' } } });
                        if (mode === 'sync-fault') throw new Error('synthetic provider directory sync fault');
                    },
                    rename: path => {
                        if (path === statusPath(world.paths) && events.at(-1) === 'sync') events.push('clear');
                    },
                };
                return stdout;
            } });
            expect(opinion.status).toBe(mode === 'ordered' ? 'valid' : 'unavailable');
            expect(events).toEqual(mode === 'ordered' ? ['unlink', 'sync', 'clear'] : mode === 'sync-fault' ? ['unlink', 'sync'] : []);
            expect(existsSync(join(world.calls[0].env.CODEX_HOME, 'sessions'))).toBe(true);
            expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: mode === 'ordered' ? null : expect.any(Object) } });
            expect(existsSync(credential!)).toBe(mode === 'unsafe-parent');
        } finally { observers.current = {}; world.lock.release(); }
    }
});

test('a cleanup fault preserves the original admission or pre-dispatch refusal and the cleanup claim', async () => {
    for (const mode of ['admission', 'pre-entry', 'pre-spawn'] as const) {
        const world = readerWorld({ codex: 'never-spawns' });
        try {
            if (mode === 'admission') admit(world.paths, budgetRequest('inc-0000000000000001', 'triage', 1), { now });
            observers.current = { unlink: path => {
                if (typeof path === 'string' && path.startsWith(world.paths.runs + '/') && basename(path) === 'auth.json')
                    throw new Error('synthetic retirement failure');
            } };
            let gateCalls = 0;
            const opinion = await triage(world, 'codex', { gate: () => ({ open: mode !== 'pre-entry' || ++gateCalls === 1, reason: 'fixture' }) });
            expect(opinion).toMatchObject({ status: 'unavailable', reason: mode === 'admission' ? 'admission refused: stage-repeated' : expect.stringContaining('reservation released') });
            expect(rows(world.paths)).toHaveLength(mode === 'admission' ? 1 : 0);
            expect(world.calls).toHaveLength(mode === 'pre-spawn' ? 1 : 0);
            expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: { phase: 'retiring' } } });
        } finally { observers.current = {}; world.lock.release(); }
    }
});

test('canonical storage overlap through a symlink refuses before either fixture tree is touched', async () => {
    const world = readerWorld();
    try {
        const link = join(world.paths.root, 'alternate-providers');
        symlinkSync(world.home, link);
        const snapshot = () => [readdirSync(world.paths.root, { recursive: true }).sort(), readdirSync(world.home, { recursive: true }).sort(),
            ...Object.keys(world.sentinels).map(path => readFileSync(path))];
        const before = snapshot();
        expect(await triage(world, 'claude', { paths: { ...world.paths, providers: join(link, '.claude', 'future') } }))
            .toMatchObject({ reason: 'the call was refused before admission: storage-overlap' });
        expect(snapshot()).toEqual(before);
        expect(world.calls).toEqual([]);
        expect(rows(world.paths)).toEqual([]);
    } finally { world.lock.release(); }
});

test('credential-bearing answers and session identifiers stay private while attributable costs can settle', async () => {
    for (const mode of ['claude-answer', 'claude-session', 'claude-model', 'codex-access', 'codex-refresh', 'codex-rotated'] as const) {
        const world = readerWorld({ codex: mode === 'codex-rotated' ? 'refresh' : 'answer' }), execute = world.setup().executor;
        const provider = mode.startsWith('claude') ? 'claude' : 'codex';
        let marker = CLAUDE_TOKEN;
        try {
            const opinion = await triage(world, provider, { executor: async (program, args, options) => {
                const stdout = await execute(program, args, provider === 'claude' ? { ...options, onOutput: undefined } : options);
                if (provider === 'codex') {
                    const dir = world.calls[0].env.CODEX_HOME, tokens = JSON.parse(readFileSync(join(dir, 'auth.json'), 'utf8')).tokens;
                    marker = mode === 'codex-access' ? tokens.access_token : tokens.refresh_token;
                    writeFileSync(resolve(dirname(dir), 'tmp/last-message.json'), JSON.stringify(defect(undefined, { causalExplanation: marker })));
                    return stdout;
                }
                const output = stdout.trim().split('\n').map(line => {
                    const event = JSON.parse(line);
                    if (mode === 'claude-session' && event.session_id) event.session_id = marker;
                    if (mode === 'claude-model' && event.type === 'assistant') event.message.model = marker;
                    if (mode === 'claude-answer' && event.type === 'result') event.structured_output.causalExplanation = marker;
                    return JSON.stringify(event) + '\n';
                }).join('');
                options?.onOutput?.('stdout', output);
                return output;
            } });
            expect(opinion.status).toBe('unavailable');
            expect(JSON.stringify(opinion)).not.toContain(marker);
            expect(JSON.stringify(rows(world.paths))).not.toContain(marker);
            expect(rows(world.paths)).toMatchObject([{ final: mode === 'claude-session' ? 0 : 1, ...(mode === 'claude-session' ? { evidence_id: null } : {}) }]);
        } finally { world.lock.release(); }
    }
});

test('a trusted rejection takes precedence over otherwise valid output and a verified refresh', async () => {
    const world = readerWorld({ codex: 'refresh' }), execute = world.setup().executor;
    try {
        const canonical = readFileSync(world.where.codexAuth, 'utf8');
        const opinion = await triage(world, 'codex', { executor: async (...args) => {
            const stdout = await execute(...args);
            const run = basename(dirname(world.calls[0].env.CODEX_HOME));
            world.behaviour.codex = 'invalid-grant';
            world.endpoint.codexRefresh(run, Buffer.from(canonical));
            return stdout;
        } });
        expect(opinion).toMatchObject({ reason: 'the call failed: the provider rejected the enrolled sign-in' });
        expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(canonical);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null, stops: { codex: [{ reason: 'refresh-rejected' }] } } });
        expect(rows(world.paths)).toMatchObject([{ final: 1 }]);
    } finally { world.lock.release(); }
});

test('synthetic rate limits and transport failures do not stop either enrollment', async () => {
    for (const provider of ['claude', 'codex'] as const) {
        for (const behaviour of ['rate-limit', 'transport'] as const) {
            const world = readerWorld({ [provider]: behaviour });
            try {
                expect((await triage(world, provider)).status).toBe('unavailable');
                expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { stops: { claude: [], codex: [] }, active: null } });
            } finally { world.lock.release(); }
        }
    }
});

test('a partial staging write is retired before the reader is admitted', async () => {
    const world = readerWorld();
    let draftFd: number | undefined;
    observers.current = {
        opened: (path, fd) => {
            if (typeof path === 'string' && path.startsWith(world.paths.runs + '/') && basename(path) === 'auth.json') draftFd = fd;
        },
        sync: fd => {
            if (fd === draftFd) { draftFd = undefined; throw new Error('synthetic staging sync failure'); }
        },
    };
    try {
        expect(await triage(world, 'codex')).toMatchObject({ reason: 'the call was refused before admission: handoff-unrecoverable' });
        expect(rows(world.paths)).toEqual([]);
        expect(world.calls).toEqual([]);
        expect(readStatus(world.paths)).toMatchObject({ ok: true, status: { active: null } });
        expect(readdirSync(world.paths.runs).some(id => existsSync(runAuthPath(join(world.paths.runs, id))))).toBe(false);
    } finally { observers.current = {}; world.lock.release(); }
});

test('a changed account or failed canonical publish suppresses the verdict while settling its receipt', async () => {
    for (const mode of ['account-changed', 'publish-fault', 'stop-fault'] as const) {
        const world = readerWorld({ codex: 'refresh' }), execute = world.setup().executor;
        const canonical = readFileSync(world.where.codexAuth, 'utf8');
        try {
            const opinion = await triage(world, 'codex', { executor: async (...args) => {
                const stdout = await execute(...args);
                if (mode === 'account-changed')
                    writeFileSync(join(world.calls[0].env.CODEX_HOME, 'auth.json'), codexAuth({ user: 'replacement-user' }));
                observers.current = { rename: destination => {
                    if (destination === world.where.codexAuth || (mode === 'stop-fault' && destination === statusPath(world.paths)))
                        throw new Error('synthetic credential publication failure');
                } };
                return stdout;
            } });
            expect(opinion).toMatchObject({ reason: 'the call failed: the Codex hand-off could not be completed safely' });
            expect(readFileSync(world.where.codexAuth, 'utf8')).toBe(canonical);
            expect(rows(world.paths)).toMatchObject([{ final: 1 }]);
            const status = readStatus(world.paths);
            if (!status.ok) throw new Error(status.reason);
            const copy = join(world.calls[0].env.CODEX_HOME, 'auth.json');
            if (mode === 'stop-fault') {
                expect(status.status.active).toMatchObject({ phase: 'launched' });
                expect(existsSync(copy)).toBe(true);
            } else {
                expect(status.status.active).toBeNull();
                expect(status.status.stops.codex).toMatchObject([{ reason: mode === 'account-changed' ? 'sign-in-account-changed' : 'rotation-uncertain' }]);
                expect(existsSync(copy)).toBe(false);
            }
        } finally { observers.current = {}; world.lock.release(); }
    }
});
