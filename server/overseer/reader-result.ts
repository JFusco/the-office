import { lstatSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { claudeCost, codexCost } from '../telemetry/run-cost';
import { parseCodexRollout, type CodexRollout } from '../telemetry/codex-rollout';
import type { InvocationResult } from './budgeted-run';
import { readRunFile } from './provider-auth/sign-in-paths';
import type { ReaderSelection } from './reader-profiles';
import { assertOwnedDirectory, runnerUid, type RunDirectories } from './run-directories';
import { within } from './runner-root';
import type { Provider } from './stages/triage';

/**
 * What a reader's process left, read by trusted runner code: its session from the first start event,
 * its terminal event, the model it actually ran and the accounting for that session. A verdict is
 * returned only when all of them agree with the selection; a call that left a valid charge but no
 * usable verdict still yields that charge, so it is settled rather than lost.
 */

export const LAST_MESSAGE_MAX_BYTES = 1024 * 1024, ROLLOUT_MAX_BYTES = 32 * 1024 * 1024, ROLLOUT_FILES_MAX = 64;

const STREAM_LINE_MAX = 1024 * 1024;
const SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function containsCredential(value: unknown, credentials: Iterable<string>): boolean {
    const serialized = JSON.stringify(value);
    return typeof serialized === 'string' && [...credentials].some(secret => serialized.includes(JSON.stringify(secret).slice(1, -1)));
}

const parseLine = (line: string): Record<string, any> | null => {
    try {
        const value = JSON.parse(line);
        return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch { return null; }
};

/** The start event's session, if this line is one. */
export function startedSession(provider: Provider, event: Record<string, any>): string | null {
    const id = provider === 'claude'
        ? event.type === 'system' && event.subtype === 'init' ? event.session_id : null
        : event.type === 'thread.started' ? event.thread_id : null;
    return typeof id === 'string' && id.trim() ? id : null;
}

/**
 * Watches stdout as it arrives: any output is activity, and the first start event's session is bound,
 * once. A second, different start or a binding that fails is a fault kept here, never thrown from the
 * output callback, so the command still drains and its credential is still retired.
 */
export class ReaderStream {
    session: string | null = null;
    fault: string | null = null;
    sawSession = false;
    private pending = '';
    private skipped = false;
    private terminal: Record<string, any> | null = null;
    constructor(private provider: Provider, private bind: (session: string) => void, private activity: () => void, private credentials: Iterable<string> = []) {}

    failureReceipt(): InvocationResult | null {
        if (!this.session || !this.terminal) return null;
        return { evidenceId: this.session, cost: claudeCost(this.terminal) };
    }

    flush(): void {
        if (!this.skipped && this.pending) this.line(this.pending);
        this.pending = '';
    }

    push(chunk: string): void {
        if (!chunk) return;
        try { this.activity(); } catch { /* activity only resets a timer */ }
        this.pending += chunk;
        let newline: number;
        while ((newline = this.pending.indexOf('\n')) >= 0) {
            const line = this.pending.slice(0, newline);
            this.pending = this.pending.slice(newline + 1);
            if (!this.skipped && line.length <= STREAM_LINE_MAX) this.line(line);
            else this.fault ??= 'the reader emitted an oversized event';
            this.skipped = false;
        }
        if (this.pending.length > STREAM_LINE_MAX) {
            this.skipped = true;
            this.pending = '';
            this.fault ??= 'the reader emitted an oversized event';
        }
    }

    private line(text: string): void {
        const event = parseLine(text);
        if (this.provider === 'claude' && this.session !== null && event?.type === 'result' && event.session_id === this.session) this.terminal = event;
        const start = this.provider === 'claude' ? event?.type === 'system' && event.subtype === 'init' : event?.type === 'thread.started';
        if (!start) return;
        this.sawSession = true;
        const session = startedSession(this.provider, event!);
        if (this.fault) return;
        if (session === null || !SESSION_ID.test(session) || containsCredential(session, this.credentials)) {
            this.fault = 'the reader reported an unusable session identifier';
            return;
        }
        if (this.session === null) {
            try { this.bind(session); this.session = session; }
            catch { this.fault = 'the launch session could not be bound'; }
        } else if (session !== this.session) this.fault = 'the provider reported a second, different session';
    }
}

export type ReaderOutcome =
    | { ok: true; model: string; output: unknown; receipt: InvocationResult }
    | { ok: false; reason: string; receipt: InvocationResult | null };

const events = (stdout: string) => stdout.split('\n').map(parseLine).filter((event): event is Record<string, any> => event !== null);

/** Claude: one start, a successful terminal `result` for the bound session, the selected model, and `structured_output`. */
export function claudeOutcome(stdout: string, bound: string, selection: ReaderSelection): ReaderOutcome {
    const all = events(stdout);
    const starts = all.map(event => startedSession('claude', event)).filter(Boolean);
    const terminal = all.filter(event => event.type === 'result').at(-1) ?? null;
    if (!terminal || terminal.session_id !== bound) return { ok: false, reason: 'no terminal result for the bound session', receipt: null };
    const receipt: InvocationResult = { evidenceId: bound, cost: claudeCost(terminal) };
    if (starts.length !== 1 || starts[0] !== bound) return { ok: false, reason: 'the provider reported more than one session', receipt };
    if (terminal.subtype !== 'success' || terminal.is_error !== false) return { ok: false, reason: 'the reader ended in an error', receipt };
    const models = new Set<string>([...all.filter(event => event.type === 'assistant').map(event => event.message?.model), ...Object.keys(terminal.modelUsage ?? {})].filter((model): model is string => typeof model === 'string'));
    if (!models.size || [...models].some(model => model !== selection.model)) return { ok: false, reason: 'the reader model did not match the selection', receipt };
    if (!Object.hasOwn(terminal, 'structured_output')) return { ok: false, reason: 'the reader returned no structured output', receipt };
    return { ok: true, model: selection.model, output: terminal.structured_output, receipt };
}

/** Every rollout candidate in the run's fresh sessions tree, read with the contained reads; anything unreadable is a gap. */
function rolloutInventory(run: RunDirectories, bound: string): { root: CodexRollout | null; gaps: string[]; unexpected: boolean } {
    const sessions = resolve(run.provider, 'sessions'), gaps: string[] = [];
    let unexpected = false, root: CodexRollout | null = null, roots = 0;
    const files: string[] = [];
    const walk = (folder: string, depth: number) => {
        let names: string[];
        try {
            if (!within(folder, run.root)) throw new Error('session-folder-outside-run');
            // A missing sessions root is normal for a call that produced no rollout. An existing
            // entry must pass physical containment before it can be listed.
            lstatSync(folder);
            assertOwnedDirectory(folder, runnerUid({}), 'not-writable');
            names = readdirSync(folder).sort();
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || folder !== sessions) gaps.push('session-folder-unreadable');
            return;
        }
        for (const name of names) {
            const path = join(folder, name);
            let stat;
            try { stat = lstatSync(path); } catch { gaps.push('session-entry-unreadable'); continue; }
            if (stat.isSymbolicLink()) { gaps.push('session-entry-linked'); continue; }
            if (stat.isDirectory()) { if (depth < 6) walk(path, depth + 1); else gaps.push('session-tree-too-deep'); }
            else if (/^rollout-.*\.jsonl$/.test(name)) files.push(path);
        }
    };
    walk(sessions, 0);
    if (files.length > ROLLOUT_FILES_MAX) gaps.push('too-many-rollouts');
    for (const file of files.slice(0, ROLLOUT_FILES_MAX)) {
        const read = readRunFile(file, run.root, ROLLOUT_MAX_BYTES);
        if (!read.ok) { gaps.push('rollout-unreadable'); continue; }
        const parsed = parseCodexRollout(Buffer.from(read.bytes).toString('utf8'), bound);
        if (parsed.threadId === bound) { roots++; root = parsed; }
        else { unexpected = true; gaps.push('unexplained-thread'); }
    }
    if (roots !== 1) { gaps.push(roots ? 'duplicate-root-rollout' : 'no-root-rollout'); if (roots > 1) root = null; }
    return { root, gaps, unexpected };
}

/** Codex: one start, a completed turn, a bounded JSON last message, and exactly one matching rollout accounting for the run. */
export function codexOutcome(stdout: string, bound: string, run: RunDirectories, selection: ReaderSelection): ReaderOutcome {
    const all = events(stdout);
    const starts = all.map(event => startedSession('codex', event)).filter(Boolean);
    const inventory = rolloutInventory(run, bound);
    const rollout = inventory.root ? { ...inventory.root, gaps: [...inventory.root.gaps, ...inventory.gaps] } : null;
    const receipt: InvocationResult = { evidenceId: bound, cost: rollout ? codexCost(rollout) : codexCost(null) };
    if (starts.length !== 1 || starts[0] !== bound) return { ok: false, reason: 'the provider reported more than one session', receipt };
    if (inventory.unexpected) return { ok: false, reason: 'the reader left activity on a thread it was not started for', receipt };
    if (!all.some(event => event.type === 'turn.completed') || all.some(event => event.type === 'turn.failed' || event.type === 'error'))
        return { ok: false, reason: 'the reader turn did not complete', receipt };
    if (!rollout) return { ok: false, reason: 'no single rollout accounts for the session', receipt };
    if (rollout.cliVersion !== selection.program.version) return { ok: false, reason: 'the rollout version did not match the reader', receipt };
    if (!rollout.models.length || rollout.models.some(model => model !== selection.model) || !rollout.requests.length
        || rollout.requests.some(request => request.effort !== selection.effort) || rollout.efforts.some(effort => effort !== selection.effort))
        return { ok: false, reason: 'the reader ran another model or effort than selected', receipt };
    if (inventory.gaps.length) return { ok: false, reason: 'the rollout inventory could not be verified', receipt };
    const last = readRunFile(resolve(run.tmp, 'last-message.json'), run.root, LAST_MESSAGE_MAX_BYTES);
    if (!last.ok) return { ok: false, reason: 'the reader left no last message', receipt };
    let output: unknown;
    try { output = JSON.parse(Buffer.from(last.bytes).toString('utf8')); }
    catch { return { ok: false, reason: 'the last message is not JSON', receipt }; }
    return { ok: true, model: selection.model, output, receipt };
}
