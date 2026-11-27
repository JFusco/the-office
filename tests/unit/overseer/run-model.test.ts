import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import type { ReservationRow } from '../../../server/overseer/budget-ledger';
import { claudeGeneration } from '../../../server/overseer/provider-auth/claude-handoff';
import { runAuthPath } from '../../../server/overseer/provider-auth/codex-handoff';
import { readStatus, stopGeneration, updateStatus } from '../../../server/overseer/provider-auth/profile-status';
import { gatedBudgeted } from '../../../server/overseer/run-model';
import { collectSecondOpinion } from '../../../server/overseer/stages/second-opinion';
import { collectTriage } from '../../../server/overseer/stages/triage';
import type { RunnerPaths } from '../../../server/overseer/config';
import { CLAUDE_TOKEN, codexAuth } from './provider-auth/provider-world';
import { CLAUDE_MODEL, readerWorld } from './run-model-world';
import { frozen } from './triage-world';

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

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
    const world = readerWorld(), environment = structuredClone(process.env), sentinelBytes = Object.fromEntries(Object.keys(world.sentinels).map(path => [path, readFileSync(path, 'utf8')]));
    try {
        const budgeted = gatedBudgeted(world.setup({ ledger: { now } })), input = frozen();
        const first = await collectTriage({ budgeted, round: 1, provider: 'claude', input });
        expect(first).toMatchObject({ status: 'valid', envelope: { provider: 'claude', model: CLAUDE_MODEL, session: 'claude-session-1' } });
        const second = await collectSecondOpinion({ budgeted, input, first: { provider: first.envelope.provider, inputIdentity: first.envelope.inputIdentity } });
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
        for (const [path, text] of Object.entries(sentinelBytes)) expect(readFileSync(path, 'utf8')).toBe(text);
        expect(readdirSync(world.home).sort()).toEqual(['.claude', '.codex']);
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
        expect(opinion).toMatchObject({ status: 'unavailable' });
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
