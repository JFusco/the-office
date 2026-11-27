import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { claudeGeneration } from '../../../server/overseer/provider-auth/claude-handoff';
import { readCodexEnvelope, type RotationEvidence } from '../../../server/overseer/provider-auth/codex-handoff';
import { prepareReaderInput } from '../../../server/overseer/reader-input';
import { claudeReader, codexReader, type ReaderSelection } from '../../../server/overseer/reader-profiles';
import type { ProviderEvidence, ReaderSetup } from '../../../server/overseer/run-model';
import { createRunDirectories } from '../../../server/overseer/run-directories';
import type { HostFacts, InnerReceipt, OuterReceipt } from '../../../server/overseer/sandbox-qualification';
import { relativeRules, type ProtectedRoots } from '../../../server/overseer/worker-sandbox-policy';
import { preparePolicy, type Executor } from '../../../server/overseer/worker-sandbox-run';
import { trustedSandbox } from '../../../server/overseer/worker-sandbox-runtime';
import { rollout } from '../telemetry/support/rollout';
import { codexAuth, enrolledRunner } from './provider-auth/provider-world';
import { fakeInstallation, shortTempDir } from './sandbox-world';
import { defect, frozen } from './triage-world';

/**
 * Test support for `run-model.ts`: a runner root with synthetic sign-ins, a fake runtime installation,
 * qualified fixture receipts for the reader profiles, synthetic interactive homes with sentinels, a
 * synthetic provider endpoint whose trusted side reports what it saw, and a fake provider that plays
 * each CLI through the executor. Nothing real is run, read or reached.
 */

const sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex');
export const CLAUDE_MODEL = 'claude-opus-5-5', CODEX_MODEL = 'gpt-6-astra';
const programOf = (path: string, version: string) => ({ path, version, sha256: sha(readFileSync(path)) });

export type ClaudeBehaviour = 'answer' | 'unauthorized' | 'quotes-401' | 'second-session' | 'other-model' | 'error-with-cost';
export type CodexBehaviour = 'answer' | 'refresh' | 'invalid-grant' | 'extra-thread' | 'other-model' | 'never-spawns' | 'hang';

/** The provider's side: which credentials it accepted, rejected or rotated, bound to the run that presented them. */
export class SyntheticEndpoint implements ProviderEvidence {
    observations: { provider: 'claude' | 'codex'; run: string; generation: string; kind: 'claude-unauthorized' | 'codex-invalid-grant' }[] = [];
    rotations = new Map<string, RotationEvidence>();
    refreshAttempts = { claude: 0, codex: 0 };
    revokedClaude = new Set<string>();
    authentication(run: string) { return this.observations.filter(seen => seen.run === run); }
    rotation(run: string) { return this.rotations.get(run) ?? null; }
}

export interface Call { argv: readonly string[]; env: Record<string, string>; input: string | undefined; cwd: string | undefined }

export function readerWorld(options: { claude?: ClaudeBehaviour; codex?: CodexBehaviour } = {}) {
    const base = shortTempDir(), runner = enrolledRunner({ base });
    const { installation } = fakeInstallation(base);
    const home = join(base, 'interactive-home');
    const protectedRoots: ProtectedRoots = {
        officeData: join(base, 'office-data'), checkoutData: join(base, 'checkout', '.local'), checkouts: [join(base, 'checkout')],
        sessionStores: [join(home, '.claude'), join(home, '.codex')],
    };
    for (const folder of [protectedRoots.officeData, protectedRoots.checkoutData, ...protectedRoots.sessionStores]) mkdirSync(folder, { recursive: true });
    // Interactive sentinels a reader must never read, change or join.
    const sentinels = { [join(home, '.claude', '.credentials.json')]: '{"interactive":"claude"}', [join(home, '.codex', 'auth.json')]: codexAuth({ loginOwner: 'login-interactive' }) };
    for (const [path, text] of Object.entries(sentinels)) writeFileSync(path, text);
    const runtime = () => trustedSandbox({ platform: 'darwin', installation, lookup: [join(installation, 'node_modules')], writable: [runner.paths.runs, ...protectedRoots.checkouts] });
    const available = runtime();
    if (available.status !== 'available') throw new Error(`fixture runtime: ${JSON.stringify(available)}`);
    const facts: HostFacts = { os: { build: '24D60', arch: 'arm64' }, node: { path: available.node, sha256: 'b'.repeat(64) }, runtime: { version: available.version, contentSha256: 'c'.repeat(64) } };
    const selections = {
        claude: claudeReader(programOf('/usr/bin/true', '2.1.328'), CLAUDE_MODEL, 'high'),
        codex: codexReader(programOf('/usr/bin/false', '0.167.0-alpha.4.1'), CODEX_MODEL, 'high'),
    };
    const runtimeReads = ['/usr/lib'];
    const receipts = qualifiedReceipts(runner.paths, protectedRoots, runtimeReads, available, facts, selections);
    const endpoint = new SyntheticEndpoint(), calls: Call[] = [];
    const behaviour = { claude: options.claude ?? 'answer', codex: options.codex ?? 'answer' };
    let sessions = 0;
    const executor: Executor = async (_executable, argv, commandOptions = {}) => {
        const env = { ...(commandOptions.replaceEnv ?? {}) }, input = commandOptions.input;
        calls.push({ argv: [...argv], env, input, cwd: commandOptions.cwd });
        const claude = 'CLAUDE_CONFIG_DIR' in env, providerDir = claude ? env.CLAUDE_CONFIG_DIR : env.CODEX_HOME;
        const run = basename(dirname(providerDir!)), lines: object[] = [];
        if (!claude && behaviour.codex === 'never-spawns') throw Object.assign(new Error('spawn refused'), { dispatched: false });
        commandOptions.onSpawn?.(999_999);
        const emit = () => {
            const stdout = lines.map(line => `${JSON.stringify(line)}\n`).join('');
            // Delivered in uneven chunks, so a line can arrive split.
            for (let at = 0; at < stdout.length; at += 37) commandOptions.onOutput?.('stdout', stdout.slice(at, at + 37));
            return stdout;
        };
        if (claude) {
            const session = `claude-session-${++sessions}`, token = env.CLAUDE_CODE_OAUTH_TOKEN, mode = behaviour.claude;
            lines.push({ type: 'system', subtype: 'init', session_id: session, model: CLAUDE_MODEL });
            if (mode === 'second-session') lines.push({ type: 'system', subtype: 'init', session_id: `${session}-b` });
            const cost = { total_cost_usd: 0.5, modelUsage: { [mode === 'other-model' ? 'claude-other' : CLAUDE_MODEL]: { costUSD: 0.5, costBasis: 'list' } } };
            if (mode === 'unauthorized' || endpoint.revokedClaude.has(token!)) {
                endpoint.observations.push({ provider: 'claude', run, generation: claudeGeneration(token!), kind: 'claude-unauthorized' });
                lines.push({ type: 'result', subtype: 'error_during_execution', is_error: true, session_id: session, total_cost_usd: 0, modelUsage: {} });
                return emit();
            }
            lines.push({ type: 'assistant', session_id: session, message: { model: mode === 'other-model' ? 'claude-other' : CLAUDE_MODEL, content: [{ type: 'text', text: mode === 'quotes-401' ? 'The log says HTTP 401 authentication_error.' : 'ok' }] } });
            lines.push(mode === 'error-with-cost'
                ? { type: 'result', subtype: 'error_max_turns', is_error: true, session_id: session, structured_output: defect(), ...cost }
                : { type: 'result', subtype: 'success', is_error: false, session_id: session, structured_output: defect(), ...cost });
            return emit();
        }
        const thread = `codex-thread-${++sessions}`, mode = behaviour.codex, auth = join(env.CODEX_HOME!, 'auth.json');
        lines.push({ type: 'thread.started', thread_id: thread }, { type: 'turn.started' });
        if (mode === 'hang') {
            emit();
            // Silent until the budget's deadline aborts it.
            return new Promise<string>((_, reject) => commandOptions.signal?.addEventListener('abort', () => reject(new Error('stopped at its deadline'))));
        }
        if (mode === 'invalid-grant') {
            endpoint.refreshAttempts.codex++;
            const seen = readCodexEnvelope(readFileSync(auth));
            if (seen.ok) endpoint.observations.push({ provider: 'codex', run, generation: seen.generation, kind: 'codex-invalid-grant' });
            lines.push({ type: 'turn.failed', error: { message: 'refresh rejected' } });
            return emit();
        }
        if (mode === 'refresh') {
            endpoint.refreshAttempts.codex++;
            const rotated = codexAuth({ refresh: `refresh-rotated-${run}`, access: `access-rotated-${run}` }), seen = readCodexEnvelope(Buffer.from(rotated));
            writeFileSync(auth, rotated);
            if (seen.ok) endpoint.rotations.set(run, { provider: 'codex', run, generation: seen.generation, credentialDigest: sha(rotated) });
        }
        const day = join(env.CODEX_HOME!, 'sessions', '2026', '11', '27');
        mkdirSync(day, { recursive: true });
        const text = (thread_: string) => rollout(thread_, [{ input: 1000, output: 200 }], { model: mode === 'other-model' ? 'gpt-other' : CODEX_MODEL, effort: 'high' }).replace('"cli_version":"0.163.0"', '"cli_version":"0.167.0-alpha.4.1"');
        writeFileSync(join(day, `rollout-2026-11-27T00-00-00-${thread}.jsonl`), text(thread));
        if (mode === 'extra-thread') writeFileSync(join(day, `rollout-2026-11-27T00-00-01-${thread}-child.jsonl`), text(`${thread}-child`));
        writeFileSync(resolve(commandOptions.cwd!, '../tmp/last-message.json'), JSON.stringify(defect()));
        lines.push({ type: 'turn.completed', usage: { input_tokens: 1000, output_tokens: 200 } });
        return emit();
    };
    const late: Promise<unknown>[] = [];
    const setup = (extra: Partial<ReaderSetup> = {}): ReaderSetup => ({
        paths: runner.paths, proof: runner.proof, retainLate: completion => { late.push(completion); }, selections, receipts, facts, runtime, protectedRoots,
        interactiveRoots: protectedRoots.sessionStores, runtimeReads, executor, evidence: endpoint,
        gate: () => ({ open: true, reason: 'fixture' }), groupState: () => 'absent', ...extra,
    });
    return { ...runner, base, home, protectedRoots, sentinels, selections, receipts, facts, endpoint, calls, late, setup, behaviour };
}

/** Receipts that qualify each profile for exactly the policy `run-model.ts` prepares, from a probe allocation with the same inputs. */
function qualifiedReceipts(paths: ReturnType<typeof enrolledRunner>['paths'], protectedRoots: ProtectedRoots, runtimeReads: readonly string[], runtime: Extract<ReturnType<typeof trustedSandbox>, { status: 'available' }>, facts: HostFacts, selections: { claude: ReaderSelection; codex: ReaderSelection }) {
    const outer: Record<string, OuterReceipt> = {}, inner: Record<string, InnerReceipt> = {};
    for (const selection of [selections.claude, selections.codex]) {
        const run = createRunDirectories(paths, randomUUID());
        prepareReaderInput(run, frozen());
        const prepared = preparePolicy({ paths, run, protectedRoots, executables: [selection.program.path], runtimeReads, runtime, provider: selection.profile.provider, programs: { [selection.profile.id]: selection.program.path } });
        const host = { ...facts, rules: relativeRules(prepared.settings, prepared.run, prepared.scratch) };
        const qualification = (profile: string, innerSeatbelt: 'supported' | 'unknown') => ({ run: prepared.run, policyDigest: prepared.digest, profile, status: 'qualified' as const, failures: [], innerSeatbelt });
        outer[selection.profile.id] = { identity: host, qualification: qualification('outer', 'unknown') };
        inner[selection.profile.id] = {
            profile: selection.profile.id, restrictionsApplied: [...selection.profile.requiredRestrictions],
            identity: { ...host, provider: { provider: selection.profile.provider, path: selection.program.path, version: selection.program.version, sha256: selection.program.sha256, argv: [...selection.argv], tools: [...selection.tools] } },
            battery: qualification(selection.profile.id, selection.profile.commandCapable ? 'supported' : 'unknown'),
            effective: { restrictions: [...selection.profile.requiredRestrictions], authentication: selection.authentication },
        };
    }
    return { outer, inner };
}
