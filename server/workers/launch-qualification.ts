import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { hostname, release } from 'node:os';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { REQUIRED_CONTROLS, type ControlRequirement } from './qualification/required-controls';
import type { LaunchTemplate } from './maintenance-template';

/**
 * Launch qualification for the maintenance worker policies of #612. A policy launches only when a harness-owned
 * record, installed after the host controls passed on the Office Mac, matches the exact invocation about to start:
 * the pinned executable (path, realpath, version, content digest), the ordered arguments and effective settings
 * after the per-assignment values are substituted, the managed configuration, tool inventory, filesystem and network
 * policy, and every required control result. Anything missing, partial, stale or different refuses the launch with
 * an `authority` stop before a worker or a fresh Effect starts. The best-effort `launch-policy.json` diagnostic is
 * separate and decides nothing here.
 */

export type MaintenanceProvider = 'claude' | 'codex';
export interface ProviderPin {
    readonly provider: MaintenanceProvider; readonly path: string; readonly version: string; readonly current: boolean;
    /** Every canonical executable (realpath) a record for this pin may bind. Deliberately approved; never read from the host. */
    readonly canonical: readonly string[];
}

/**
 * Every maintenance provider path the Office has pinned. The current entry per provider is the one a launch selects.
 * A deliberate requalification at a new path adds the new entry as current and keeps the earlier ones (no longer
 * current) so the Vitest guard still refuses them and an old record cannot authorize a launch. A record can authorize
 * only a canonical path listed here, so the guard's literal defaults name every executable a record can start.
 */
export const MAINTENANCE_PROVIDER_PINS: readonly ProviderPin[] = Object.freeze([
    Object.freeze({ provider: 'claude' as const, path: '/Users/joe.fusco/.local/share/claude/versions/2.1.332', version: '2.1.332', current: true,
        canonical: Object.freeze(['/Users/joe.fusco/.local/share/claude/versions/2.1.332']) }),
    Object.freeze({ provider: 'codex' as const, path: '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex', version: '0.171.0-alpha.13.2', current: true,
        canonical: Object.freeze(['/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex']) }),
]);

/** The pin a fresh launch of this provider selects. Exactly one current entry per provider. */
export function currentPin(provider: MaintenanceProvider): ProviderPin {
    const pins = MAINTENANCE_PROVIDER_PINS.filter(pin => pin.provider === provider && pin.current);
    if (pins.length !== 1) throw new Error(`Exactly one current ${provider} maintenance pin is required`);
    return pins[0];
}

/** Every registered provider path and canonical executable, current or retired, for the Vitest live-provider guard. */
export function registeredPinPaths(): string[] {
    return [...new Set(MAINTENANCE_PROVIDER_PINS.flatMap(pin => [pin.path, ...pin.canonical]))];
}

/** Why a resolved executable may not be authorized for this pin, or undefined: it must be one of the pin's registered canonical paths. */
export function unregisteredExecutable(pin: ProviderPin, realpath: string): string | undefined {
    return pin.canonical.includes(realpath) ? undefined : `the pinned executable resolves to ${realpath}, which is not a registered canonical path for ${pin.provider}`;
}

/** Managed configuration each provider reads regardless of its arguments; a record binds every one (absent = null). */
export const MANAGED_CONFIGURATION: Readonly<Record<MaintenanceProvider, readonly string[]>> = Object.freeze({
    claude: Object.freeze(['/Library/Application Support/ClaudeCode/managed-settings.json', '/Library/Application Support/ClaudeCode/managed-mcp.json']),
    codex: Object.freeze(['/etc/codex/managed_config.toml', '/etc/codex/requirements.toml']),
});

/** The per-assignment values a record leaves as placeholders and the harness binds for each launch. */
export const PLACEHOLDERS = ['session', 'schema', 'schemaPath', 'cwd', 'scratch', 'gitDir', 'gitCommonDir', 'branchRef', 'model', 'effort'] as const;
export type Placeholder = typeof PLACEHOLDERS[number];
export type LaunchBindings = Partial<Record<Placeholder, string>>;

const Sha = z.string().regex(/^[a-f0-9]{64}$/);
const Control = z.object({ id: z.string().min(1), facility: z.string().min(1), kind: z.enum(['allow', 'deny']), pairedWith: z.string().optional(),
    result: z.enum(['passed', 'failed', 'unavailable']), evidence: z.string().min(1) }).strict();
export const QualificationRecord = z.object({
    version: z.literal(1),
    policy: z.string().min(1),
    provider: z.enum(['claude', 'codex']),
    stages: z.array(z.string().min(1)).min(1),
    host: z.object({ hostname: z.string().min(1), platform: z.string().min(1), arch: z.string().min(1), release: z.string().min(1) }).strict(),
    executable: z.object({ path: z.string().min(1), realpath: z.string().min(1), version: z.string().min(1), sha256: Sha }).strict(),
    /** Ordered argument template; `{placeholder}` spans are the only substituted parts. */
    arguments: z.array(z.string()),
    /** Effective settings the launch passes (Claude `--settings`, Codex `-c` overrides as an object), as a template. */
    settings: z.unknown(),
    managedConfiguration: z.array(z.object({ path: z.string().min(1), sha256: Sha.nullable() }).strict()),
    tools: z.array(z.string()),
    filesystem: z.object({ readable: z.array(z.string()), writable: z.array(z.string()), denied: z.array(z.string()) }).strict(),
    network: z.object({ allowed: z.array(z.string()) }).strict(),
    controls: z.array(Control),
    qualifiedAt: z.iso.datetime(),
    qualifiedBy: z.string().min(1),
}).strict();
export type QualificationRecord = z.infer<typeof QualificationRecord>;

/** A refused launch: which stage, which qualification it needed and what did not match. Recorded as an `authority` stop. */
export class LaunchQualificationRefusal extends Error {
    constructor(public stage: string, public qualification: string, public mismatch: string) {
        super(`Maintenance launch for ${stage} is not qualified (${qualification}): ${mismatch}. The worker was not started and no fresh Effect was sent; requalify on the Office host (docs/maintenance-launch-qualification.md).`);
        this.name = 'LaunchQualificationRefusal';
    }
}

/** Where a policy's record lives: harness-owned project data, outside every worker-writable root. */
export const qualificationFile = (dataRoot: string, policy: string) => resolve(dataRoot, 'launch-qualification', `${policy}.json`);

export interface HostIdentity { hostname: string; platform: string; arch: string; release: string }
/** Host facts and file reads, injectable so tests never depend on the machine they run on. */
export interface QualificationEnvironment {
    host: () => HostIdentity;
    realpath: (path: string) => string;
    sha256: (path: string) => string | null;
    read: (path: string) => string | null;
}
const fileDigest = (path: string): string | null => {
    try { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
    }
};
export const HOST_ENVIRONMENT: QualificationEnvironment = {
    host: () => ({ hostname: hostname(), platform: process.platform, arch: process.arch, release: release() }),
    realpath: path => realpathSync(path),
    sha256: fileDigest,
    read: path => existsSync(path) ? readFileSync(path, 'utf8') : null,
};

/** The record for a policy, or why there is none usable. Never throws for a missing or malformed file. */
export function readQualification(dataRoot: string, policy: string, environment: QualificationEnvironment = HOST_ENVIRONMENT): { record: QualificationRecord; sha256: string } | { missing: string } {
    const text = environment.read(qualificationFile(dataRoot, policy));
    if (text === null) return { missing: 'no qualification record is installed' };
    try {
        const record = QualificationRecord.parse(JSON.parse(text));
        return { record, sha256: createHash('sha256').update(text).digest('hex') };
    } catch { return { missing: 'the qualification record is malformed' }; }
}

/** Every required control for the policy passed once, of its kind, and each denial is paired with a passing working control of the same facility. */
export function controlCoverage(policy: string, controls: QualificationRecord['controls'], required: readonly ControlRequirement[] = REQUIRED_CONTROLS[policy] ?? []): string | undefined {
    if (!required.length) return `no control battery is defined for ${policy}`;
    for (const need of required) {
        const found = controls.filter(control => control.id === need.id);
        if (found.length !== 1) return `control ${need.id} is ${found.length ? 'recorded more than once' : 'missing'}`;
        const [control] = found;
        if (control.kind !== need.kind || control.facility !== need.facility) return `control ${need.id} records the wrong kind or facility`;
        if (control.result !== 'passed') return `control ${need.id} ${control.result}`;
        if (need.kind === 'deny') {
            const pair = controls.find(other => other.id === need.pairedWith);
            if (!need.pairedWith || control.pairedWith !== need.pairedWith || !pair || pair.kind !== 'allow' || pair.result !== 'passed' || pair.facility !== need.facility)
                return `denial ${need.id} has no passing working control for ${need.facility}`;
        }
    }
}

/** Compare the exact template shared by installation, status, publication and final launch admission. */
export function templateMismatch(record: QualificationRecord, template: LaunchTemplate): string | undefined {
    if (record.policy !== template.policy || record.provider !== template.provider) return 'the record is for another policy or provider';
    for (const field of ['arguments', 'settings', 'tools', 'filesystem', 'network'] as const)
        if (!isDeepStrictEqual(record[field], template[field])) return `the record's ${field} differ from the launch template this build uses`;
}

/** A null digest can only match a confirmed absent file. */
export function managedConfigurationMismatch(record: QualificationRecord, environment: QualificationEnvironment): string | undefined {
    if (MANAGED_CONFIGURATION[record.provider].some(path => !record.managedConfiguration.some(entry => entry.path === path)))
        return 'the record does not bind every managed configuration file';
    for (const entry of record.managedConfiguration) {
        let actual: string | null;
        try { actual = environment.sha256(entry.path); } catch { return `managed configuration ${entry.path} could not be read`; }
        if (actual !== entry.sha256) return `managed configuration ${entry.path} changed`;
    }
}

/** The host-level parts of a record that do not depend on one assignment: pin, binary, host, managed configuration and controls. */
function hostMismatch(record: QualificationRecord, policy: string, stage: string | undefined, environment: QualificationEnvironment): string | undefined {
    if (record.policy !== policy) return `the record qualifies ${record.policy}`;
    if (stage !== undefined && !record.stages.includes(stage)) return `stage ${stage} is not covered by this qualification (partial qualification)`;
    const pin = currentPin(record.provider);
    if (record.executable.path !== pin.path || record.executable.version !== pin.version) return `the record binds ${record.executable.path} ${record.executable.version}, not the current pin ${pin.path} ${pin.version} (stale)`;
    let real: string;
    try { real = environment.realpath(pin.path); } catch { return `the pinned executable ${pin.path} is not installed`; }
    if (real !== record.executable.realpath) return `the pinned executable now resolves to ${real}`;
    const unregistered = unregisteredExecutable(pin, real);
    if (unregistered) return unregistered;
    try {
        if (environment.sha256(real) !== record.executable.sha256) return 'the pinned executable binary digest changed';
    } catch { return 'the pinned executable binary could not be read'; }
    if (!isDeepStrictEqual(environment.host(), record.host)) return 'the record was qualified on another host or OS release';
    return managedConfigurationMismatch(record, environment) ?? controlCoverage(policy, record.controls);
}

/** A placeholder template with the bound values written in; an unbound placeholder is left as is, so it cannot match. */
export function substitute(template: string, bindings: LaunchBindings): string {
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => (PLACEHOLDERS as readonly string[]).includes(name) && typeof bindings[name as Placeholder] === 'string' ? bindings[name as Placeholder]! : whole);
}
/** The same substitution through every string of a settings template. */
export const substituteDeep = (value: unknown, bindings: LaunchBindings): unknown =>
    typeof value === 'string' ? substitute(value, bindings) : Array.isArray(value) ? value.map(item => substituteDeep(item, bindings))
        : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, substituteDeep(item, bindings)])) : value;

/** What the harness bound for this assignment; each bound value must be the one the harness selected. */
export interface HarnessBindings { session: string; schemaPath: string; cwd: string; scratch?: string; gitDir?: string; gitCommonDir?: string; branchRef?: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface LaunchCheck {
    dataRoot: string;
    stage: string;
    policy: string;
    provider: MaintenanceProvider;
    executablePath: string;
    template: LaunchTemplate;
    args: readonly string[];
    settings: unknown;
    bindings: LaunchBindings;
    harness: HarnessBindings;
}
export interface QualifiedLaunch { policy: string; recordSha256: string; executable: QualificationRecord['executable'] }

function bindingMismatch(check: LaunchCheck, environment: QualificationEnvironment): string | undefined {
    const { bindings, harness } = check;
    if (bindings.session !== harness.session || !UUID.test(harness.session)) return 'the session ID is not the fresh harness-bound session';
    if (bindings.schemaPath !== harness.schemaPath) return 'the schema path is not the harness-bound schema';
    if (bindings.schema !== undefined && bindings.schema !== environment.read(harness.schemaPath)) return 'the inline schema differs from the harness-bound schema';
    if (bindings.cwd !== harness.cwd) return 'the working directory is not the harness-bound cwd';
    for (const name of ['scratch', 'gitDir', 'gitCommonDir', 'branchRef'] as const)
        if (bindings[name] !== harness[name]) return `the ${name} binding is not the harness-bound value`;
}

/**
 * Admits one launch: the record for the policy must cover the stage on this host with the current pin and its binary,
 * and the final arguments and settings must equal the record's templates after the harness-bound values are written
 * in. Throws `LaunchQualificationRefusal` otherwise. Pure apart from the injected environment.
 */
export function assertQualifiedLaunch(check: LaunchCheck, environment: QualificationEnvironment = HOST_ENVIRONMENT): QualifiedLaunch {
    const refuse = (mismatch: string): never => { throw new LaunchQualificationRefusal(check.stage, check.policy, mismatch); };
    const found = readQualification(check.dataRoot, check.policy, environment);
    if ('missing' in found) return refuse(found.missing);
    const { record } = found;
    if (record.provider !== check.provider) refuse(`the record qualifies ${record.provider}`);
    const host = hostMismatch(record, check.policy, check.stage, environment);
    if (host) refuse(host);
    if (check.executablePath !== record.executable.path) refuse(`the launch selects ${check.executablePath}, not the qualified executable`);
    const bound = bindingMismatch(check, environment);
    if (bound) refuse(bound);
    const stale = templateMismatch(record, check.template);
    if (stale) refuse(stale);
    const args = record.arguments.map(arg => substitute(arg, check.bindings));
    if (!isDeepStrictEqual(args, [...check.args])) refuse('the ordered arguments differ from the qualified invocation');
    if (!isDeepStrictEqual(substituteDeep(record.settings, check.bindings), check.settings)) refuse('the effective settings differ from the qualified invocation');
    return { policy: record.policy, recordSha256: found.sha256, executable: record.executable };
}

/**
 * Before the first fresh publication Effect: every policy the chain needs is qualified on this host for its stages,
 * with the current pin and binary. Returns the first refusal, or undefined.
 */
export function policiesQualified(dataRoot: string, needs: readonly { policy: string; stage: string }[], environment: QualificationEnvironment = HOST_ENVIRONMENT): LaunchQualificationRefusal | undefined {
    for (const need of needs) {
        const found = readQualification(dataRoot, need.policy, environment);
        if ('missing' in found) return new LaunchQualificationRefusal(need.stage, need.policy, found.missing);
        const host = hostMismatch(found.record, need.policy, need.stage, environment);
        if (host) return new LaunchQualificationRefusal(need.stage, need.policy, host);
    }
}
