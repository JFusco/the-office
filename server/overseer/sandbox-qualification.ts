import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { RunDirectories } from './run-directories';
import { within } from './runner-root';
import type { WorkerProvider } from './worker-environment';
import type { ReaderAuthentication, ReaderSelection } from './reader-profiles';
import { expandRules, policyDigest, relativeRules, type SandboxSettings } from './worker-sandbox-policy';
import { SandboxRefusal, verifyPrepared, type PreparedPolicy } from './worker-sandbox-run';
import { SANDBOX_RUNTIME } from './worker-sandbox-runtime';

/**
 * What it takes to call the outer sandbox qualified, and which reader profiles may then run nested
 * inside it. 7b defines the battery and its reading and exercises them with recorded observations
 * only; the real battery runs on an approved installation in a later delivery, which also keeps
 * receipts. Until runner-owned host receipts exist the shipped gate stays closed, whatever any
 * simulated result says.
 */

/** Must succeed inside the sandbox. `startup` also covers the exact argv round-trip and the working directory. */
export const ALLOW_PROBES = ['startup', 'snapshot-read', 'tmp-write', 'provider-write', 'tmpdir-api', 'java-agent-reference'] as const;
/** Must be refused inside the sandbox, each beside a successful same-operation control. */
export const DENIAL_CODES = {
    'read-sibling': 'read-permission-denied',
    'read-runner-state': 'read-permission-denied',
    'read-office-data': 'read-permission-denied',
    'read-claude-config': 'read-permission-denied',
    'read-codex-config': 'read-permission-denied',
    'write-snapshot': 'write-permission-denied',
    'write-run-root': 'write-permission-denied',
    'write-sibling': 'write-permission-denied',
    'write-policy': 'write-permission-denied',
    'write-shared-tmp': 'write-permission-denied',
    'write-private-shared-tmp': 'write-permission-denied',
    'replace-policy': 'replace-permission-denied',
    'replace-snapshot': 'replace-permission-denied',
    'credential-store': 'credential-access-denied',
    'network-direct': 'connect-permission-denied',
    'network-proxied': 'proxy-allowlist-denied',
    'loopback': 'connect-permission-denied',
    'unix-socket': 'unix-connect-permission-denied',
    'launchd-ipc': 'launchd-query-denied',
    'proxy-forwarding': 'proxy-allowlist-denied',
} as const;
type DenyProbe = keyof typeof DENIAL_CODES;
export const DENY_PROBES = Object.keys(DENIAL_CODES) as DenyProbe[];
/** Deny probes that change a sentinel: its original bytes must be verified afterwards. */
const SENTINEL_PROBES = new Set<string>(['write-snapshot', 'write-run-root', 'write-sibling', 'write-policy', 'write-shared-tmp', 'write-private-shared-tmp', 'replace-policy', 'replace-snapshot']);
/** The runner records its own writes and checks that the payload, process group and proxy exit. */
const CLEANUP_PROBES = { 'cleanup-success': 'success', 'cleanup-failure': 'failure', 'cleanup-interrupted': 'interrupted' } as const;
type CleanupProbe = keyof typeof CLEANUP_PROBES;
export const RECORD_PROBES = ['parent-footprint', ...Object.keys(CLEANUP_PROBES) as CleanupProbe[]] as const;
/** Recorded apart from the outer battery: whether a Seatbelt profile can be applied inside it. */
export const NESTED_PROBE = 'nested-seatbelt';
export type ProbeId = typeof ALLOW_PROBES[number] | DenyProbe | typeof RECORD_PROBES[number] | typeof NESTED_PROBE;
const KNOWN = new Set<string>([...ALLOW_PROBES, ...DENY_PROBES, ...RECORD_PROBES, NESTED_PROBE]);

type Binding = { run: string; policyDigest: string; profile: string };
type Control = Binding & { probe: ProbeId; result: 'succeeded' | 'failed' | 'unavailable' };
type Cleanup = { termination: typeof CLEANUP_PROBES[CleanupProbe]; payloadExited: boolean; groupExited: boolean; proxyClosed: boolean };
type ProxyObservation = { http: string; socks: string; reachableIpc: readonly string[] };

export interface Observation extends Binding {
    probe: string;
    /** The payload's start marker was seen. */
    started: boolean;
    outcome: 'allowed' | 'denied' | 'inconclusive' | 'sandbox-failed' | 'recorded' | 'ended' | 'refused' | 'restricted';
    /** The same operation, outside the sandbox, against a disposable target. */
    control?: Control['result'];
    refusalCode?: string;
    /** A changed sentinel's original bytes were verified afterwards. */
    intact?: boolean;
    cwd?: string;
    argv?: readonly string[];
    tmpdir?: string;
    tempFile?: string;
    javaAgentJar?: string;
    proxy?: ProxyObservation;
    writes?: readonly string[];
    cleanup?: Cleanup;
}

type ProbeCompletion = 'exited' | 'rejected' | 'signalled' | 'cancelled' | 'setup-failed';
export const PROBE_LINE_PREFIX = 'overseer-probe ';

function boundTo(record: Record<string, unknown> | Binding, binding: Binding): boolean {
    return record.run === binding.run && record.policyDigest === binding.policyDigest && record.profile === binding.profile;
}

/** Complete stdout lines supply payload evidence. Controls and sentinel read-back come from the runner. */
export function observe(probe: ProbeId, binding: Binding, lines: readonly string[], completion: ProbeCompletion, control?: Control, intact?: boolean): Observation {
    let starts = 0, invalid = false;
    const terminals: Record<string, unknown>[] = [];
    for (const line of lines) {
        if (!line.startsWith(PROBE_LINE_PREFIX)) continue;
        try {
            const parsed: unknown = JSON.parse(line.slice(PROBE_LINE_PREFIX.length));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { invalid = true; continue; }
            const record = parsed as Record<string, unknown>;
            if (!boundTo(record, binding) || record.probe !== probe) invalid = true;
            else if (record.kind === 'start' && terminals.length === 0) starts++;
            else if (record.kind === 'terminal') terminals.push(record);
            else invalid = true;
        } catch { invalid = true; }
    }

    const observation: Observation = {
        run: binding.run, policyDigest: binding.policyDigest, profile: binding.profile, probe,
        started: starts > 0, outcome: 'inconclusive',
    };
    if (control?.probe === probe && boundTo(control, binding)) observation.control = control.result;
    if (SENTINEL_PROBES.has(probe)) observation.intact = intact;
    if (invalid) return observation;
    if (completion === 'setup-failed' && starts === 0 && terminals.length === 0)
        return { ...observation, outcome: 'sandbox-failed' };
    if (completion !== 'exited' || starts !== 1 || terminals.length !== 1) return observation;

    const record = terminals[0];
    if (record.outcome === 'allowed') observation.outcome = 'allowed';
    if (probe === NESTED_PROBE && (record.outcome === 'refused' || record.outcome === 'restricted')) observation.outcome = record.outcome;
    if (typeof record.refusalCode === 'string') observation.refusalCode = record.refusalCode;
    if (record.outcome === 'denied' && Object.hasOwn(DENIAL_CODES, probe) &&
        observation.refusalCode === DENIAL_CODES[probe as DenyProbe] && observation.control === 'succeeded')
        observation.outcome = 'denied';

    // Retain only the fields the probe needs. Credential evidence contains only its disposition.
    switch (probe) {
        case 'startup':
            if (typeof record.cwd === 'string') observation.cwd = record.cwd;
            if (Array.isArray(record.argv) && record.argv.every(arg => typeof arg === 'string')) observation.argv = record.argv;
            break;
        case 'tmpdir-api':
            if (typeof record.tmpdir === 'string') observation.tmpdir = record.tmpdir;
            if (typeof record.tempFile === 'string') observation.tempFile = record.tempFile;
            break;
        case 'java-agent-reference':
            if (typeof record.javaAgentJar === 'string') observation.javaAgentJar = record.javaAgentJar;
            break;
        case 'proxy-forwarding': {
            const proxy = record.proxy as Partial<ProxyObservation> | undefined;
            if (typeof proxy?.http === 'string' && typeof proxy.socks === 'string' &&
                Array.isArray(proxy.reachableIpc) && proxy.reachableIpc.every(name => typeof name === 'string'))
                observation.proxy = { http: proxy.http, socks: proxy.socks, reachableIpc: proxy.reachableIpc };
            break;
        }
    }
    return observation;
}

/** The callback forwards onLine to the injected command. Output remains available after rejection. */
export async function collectProbe(probe: ProbeId, binding: Binding, execute: (onLine: (line: string) => void) => Promise<string>,
    options: { control?: Control; intact?: boolean; signal?: AbortSignal } = {}): Promise<Observation> {
    const lines: string[] = [];
    let completion: ProbeCompletion = 'exited';
    try { await execute(line => { if (line.startsWith(PROBE_LINE_PREFIX)) lines.push(line); }); }
    catch (error) { completion = error instanceof SandboxRefusal ? 'setup-failed' : 'rejected'; }
    return observe(probe, binding, lines, options.signal?.aborted ? 'cancelled' : completion, options.control, options.intact);
}

interface BatteryExpected {
    run: RunDirectories;
    policyDigest: string;
    profile: string;
    argv: readonly string[];
    javaAgentJar: string;
    wrapperTmp: string;
    allowedIpc: readonly string[];
}
export interface Qualification {
    run: RunDirectories;
    policyDigest: string;
    profile: string;
    status: 'qualified' | 'unqualified';
    failures: string[];
    innerSeatbelt: 'supported' | 'unsupported' | 'unknown';
}

function strictlyInside(path: string, root: string): boolean {
    return isAbsolute(path) && resolve(path) === path && path !== root && within(path, root);
}

/** Qualified only when every required observation is present once, for this run, policy and profile, and shows what it must. */
export function qualify(observations: readonly Observation[], expected: BatteryExpected): Qualification {
    const { run, policyDigest, profile } = expected;
    const binding = { run: run.id, policyDigest, profile };
    const failures: string[] = [], seen = new Map<string, Observation>(), invalid = new Set<string>();
    for (const observation of observations) {
        const { probe } = observation;
        if (!KNOWN.has(probe)) { failures.push(`${probe}: not a probe of this battery`); continue; }
        if (seen.has(probe)) { invalid.add(probe); failures.push(`${probe}: recorded more than once`); continue; }
        seen.set(probe, observation);
        if (!boundTo(observation, binding)) {
            invalid.add(probe);
            failures.push(`${probe}: recorded for another run, policy or profile`);
        }
    }
    const judge = (probe: ProbeId, outcome: Observation['outcome'], check?: (observation: Observation) => string | undefined) => {
        const observation = seen.get(probe);
        if (!observation) { failures.push(`${probe}: missing`); return; }
        if (invalid.has(probe)) return;
        if (observation.outcome === 'sandbox-failed') { failures.push(`${probe}: the sandbox failed before the payload started`); return; }
        if (!observation.started && outcome !== 'ended' && outcome !== 'recorded') { failures.push(`${probe}: payload start not confirmed`); return; }
        const fault = observation.outcome !== outcome ? `expected ${outcome}, saw ${observation.outcome}` : check?.(observation);
        if (fault) failures.push(`${probe}: ${fault}`);
    };
    for (const probe of ALLOW_PROBES) judge(probe, 'allowed', o => {
        if (probe === 'startup' && (o.cwd !== run.home || !isDeepStrictEqual(o.argv, expected.argv))) return 'cwd or argv differs from the invocation';
        if (probe === 'tmpdir-api' && (o.tmpdir !== run.tmp || !o.tempFile || !strictlyInside(o.tempFile, run.tmp)))
            return 'effective TMPDIR and the created file must be in the run tmp layout';
        if (probe === 'java-agent-reference' && o.javaAgentJar !== expected.javaAgentJar) return 'expected the verified Java agent path';
    });
    for (const probe of DENY_PROBES) judge(probe, 'denied', o => {
        if (o.control !== 'succeeded') return `its positive control ${o.control ?? 'is missing'}`;
        if (o.refusalCode !== DENIAL_CODES[probe]) return 'operation-specific enforcement was not confirmed';
        if (SENTINEL_PROBES.has(probe) && o.intact !== true) return 'the sentinel was not verified intact';
        if (probe === 'proxy-forwarding' && (o.proxy?.http !== DENIAL_CODES[probe] || o.proxy.socks !== DENIAL_CODES[probe] ||
            !Array.isArray(o.proxy.reachableIpc) || o.proxy.reachableIpc.some(name => !expected.allowedIpc.includes(name))))
            return 'HTTP or SOCKS forwarding or the remaining IPC surface was not verified';
    });
    judge('parent-footprint', 'recorded', o => {
        if (!Array.isArray(o.writes) || o.writes.some(path => typeof path !== 'string' || !strictlyInside(path, expected.wrapperTmp)))
            return 'parent writes were not confined to the wrapper folder';
    });
    for (const probe of Object.keys(CLEANUP_PROBES) as CleanupProbe[]) judge(probe, 'ended', o => {
        if (o.cleanup?.termination !== CLEANUP_PROBES[probe] || o.cleanup.payloadExited !== true || o.cleanup.groupExited !== true || o.cleanup.proxyClosed !== true)
            return 'payload, process group and proxy exit were not confirmed for this termination';
    });
    const nested = seen.get(NESTED_PROBE);
    let innerSeatbelt: Qualification['innerSeatbelt'] = 'unknown';
    if (nested && !invalid.has(NESTED_PROBE) && nested.control === 'succeeded' && nested.started) {
        if (nested.outcome === 'refused' && nested.refusalCode === 'seatbelt-apply-denied') innerSeatbelt = 'unsupported';
        if (nested.outcome === 'restricted') innerSeatbelt = 'supported';
    }
    return { run: { ...run }, policyDigest, profile, status: failures.length ? 'unqualified' : 'qualified', failures, innerSeatbelt };
}

/** Everything a receipt is bound to; compared field by field with the invocation about to run. */
export interface HostIdentity {
    os: { build: string; arch: string };
    node: { path: string; sha256: string };
    runtime: { version: string; contentSha256: string };
    /** Serialized policy with the builder's allocation-owned paths written relative to the run folder. */
    rules: string;
}
export interface ProviderIdentity { provider: WorkerProvider; path: string; version: string; sha256: string; argv: readonly string[]; tools: readonly string[] }
export interface OuterReceipt { identity: HostIdentity; qualification: Qualification }
/** What the inner battery observed in effect for the actual binary, not what its arguments say. */
export interface EffectiveEvidence { restrictions: readonly string[]; authentication: ReaderAuthentication; externalMcp?: readonly string[] }
export interface InnerReceipt {
    profile: string; identity: HostIdentity & { provider: ProviderIdentity }; restrictionsApplied: readonly string[]; battery: Qualification;
    /** Absent on a receipt older than the evidence; such a receipt qualifies nothing. */
    effective?: EffectiveEvidence;
}
/** The host facts eligibility is given, established independently of any receipt. */
export type HostFacts = Omit<HostIdentity, 'rules'>;
export interface ReaderProfile { id: string; provider: 'claude' | 'codex'; commandCapable: boolean; requiredRestrictions: readonly string[] }

/** The two reader profiles section 7 names. Neither has inner evidence yet. */
export const READER_PROFILES = {
    claude: { id: 'claude-reader', provider: 'claude', commandCapable: false, requiredRestrictions: ['safe-mode', 'restricted', 'strict-mcp-config', 'hooks-disabled', 'no-chrome', 'permission-prompts-none', 'tools-read-glob-grep'] },
    codex: { id: 'codex-reader', provider: 'codex', commandCapable: true, requiredRestrictions: ['explicit-model-effort', 'read-only-sandbox', 'approval-never', 'ignore-user-config', 'no-agents-or-customizations'] },
} as const satisfies Record<string, ReaderProfile>;

export type Eligibility = { eligible: true } | { eligible: false; reason: 'outer-unqualified' | 'outer-identity-mismatch' | 'inner-seatbelt-unsupported' | 'inner-restriction-unverified' | 'inner-identity-mismatch' | 'inner-evidence-missing' };

/**
 * A profile may run nested in the sandbox only with both receipts: the outer battery for this host,
 * runtime and rules, and its own inner receipt for this exact provider binary and invocation, showing
 * every restriction it requires applied, the same restrictions and sign-in method observed in effect,
 * and the reader battery passed through it. The current identity is never taken from the caller: its
 * rules come from the prepared policy's verified bytes and its provider from the selection, whose
 * program is hashed here. A command-capable reader needs affirmative inner Seatbelt evidence.
 */
export function profileEligibility(selection: ReaderSelection, facts: HostFacts, prepared: PreparedPolicy, outer?: OuterReceipt | null, inner?: InnerReceipt | null): Eligibility {
    const { profile } = selection;
    if (!outer || outer.qualification.status !== 'qualified') return { eligible: false, reason: 'outer-unqualified' };
    try { verifyPrepared(prepared); }
    catch { return { eligible: false, reason: 'outer-identity-mismatch' }; }
    // The rules in force are the policy file's own, as it is on disk now, never a description of it.
    let rules: string;
    try {
        // `verifyPrepared` above has just checked this file against the prepared digest.
        const onDisk = readFileSync(prepared.file, 'utf8');
        rules = relativeRules(JSON.parse(onDisk) as SandboxSettings, prepared.run, prepared.scratch);
    } catch { return { eligible: false, reason: 'outer-identity-mismatch' }; }
    const host: HostIdentity = { os: facts.os, node: facts.node, runtime: facts.runtime, rules };
    if (!isDeepStrictEqual(outer.identity, host) || host.node.path !== prepared.runtime.node || host.runtime.version !== prepared.runtime.version)
        return { eligible: false, reason: 'outer-identity-mismatch' };
    if (!matchesPolicy(outer.identity.rules, outer.qualification.run, outer.qualification.policyDigest) ||
        !matchesPolicy(outer.identity.rules, prepared.run, prepared.digest))
        return { eligible: false, reason: 'outer-identity-mismatch' };
    const provider: ProviderIdentity = {
        provider: profile.provider, path: selection.program.path, version: selection.program.version, sha256: selection.program.sha256,
        argv: [...selection.argv], tools: [...selection.tools],
    };
    if (prepared.provider !== profile.provider || prepared.programs[profile.id] !== provider.path || programDigest(provider.path) !== provider.sha256)
        return { eligible: false, reason: 'inner-identity-mismatch' };
    if (profile.commandCapable && outer.qualification.innerSeatbelt === 'unsupported') return { eligible: false, reason: 'inner-seatbelt-unsupported' };
    if (!inner || inner.profile !== profile.id || inner.battery.profile !== profile.id)
        return { eligible: false, reason: 'inner-restriction-unverified' };
    const current = { ...host, provider };
    if (!isDeepStrictEqual(inner.identity, current) || !matchesPolicy(inner.identity.rules, inner.battery.run, inner.battery.policyDigest))
        return { eligible: false, reason: 'inner-identity-mismatch' };
    if (profile.commandCapable && inner.battery.innerSeatbelt !== 'supported')
        return { eligible: false, reason: 'inner-seatbelt-unsupported' };
    if (inner.battery.status !== 'qualified' || !profile.requiredRestrictions.every(restriction => inner.restrictionsApplied.includes(restriction)))
        return { eligible: false, reason: 'inner-restriction-unverified' };
    if (!inner.effective || inner.effective.authentication !== selection.authentication
        || !profile.requiredRestrictions.every(restriction => inner.effective!.restrictions.includes(restriction))
        || (profile.provider === 'claude' && (!Array.isArray(inner.effective.externalMcp) || inner.effective.externalMcp.length !== 0)))
        return { eligible: false, reason: 'inner-evidence-missing' };
    return { eligible: true };
}

/** The selected program's content digest, read now; an unreadable program matches nothing. */
function programDigest(path: string): string | null {
    try { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
    catch { return null; }
}

function matchesPolicy(rules: string, run: RunDirectories, digest: string): boolean {
    try { return policyDigest(expandRules(rules, run)) === digest; }
    catch { return false; }
}

/**
 * The shipped gate is closed. The recorded host (2026-11-26) failed outer qualification, and no
 * qualifying runner-owned receipts exist (docs/overseer.md, Phase 7 exit).
 */
export const SANDBOX_STATUS = {
    status: 'unqualified',
    reason: 'The recorded host failed outer sandbox qualification and qualifying runner-owned receipts are missing',
    runtime: SANDBOX_RUNTIME,
    profiles: { [READER_PROFILES.claude.id]: 'outer-unqualified', [READER_PROFILES.codex.id]: 'outer-unqualified' },
    knownBlockers: [
        'outer: launchd was reachable under the tested policy (a real /bin/launchctl query reached launchd)',
        'outer: credential-item access was untested, and the runtime base profile permits the com.apple.securityd.xpc and com.apple.SecurityServer lookups',
        'outer: shared-temp writes were inconclusive (/tmp/claude was absent; both spellings are in the runtime default write set and the policy denyWrite)',
        'codex-reader: a Seatbelt profile cannot be applied inside another on Darwin 24.3 (sandbox_apply: Operation not permitted, exit 71), so a command-capable Codex reader stays unqualified',
        'claude-reader: no inner receipt shows its restrictions applied to the actual binary',
    ],
} as const;

export function modelDispatchGate(): { open: false; reason: string } {
    return { open: false, reason: SANDBOX_STATUS.reason };
}
