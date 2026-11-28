import { lstatSync, readdirSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { claudeEditorTemplate, claudeReaderTemplate, type ProtectedRoots } from './claude-maintenance-arguments';
import { codexChecksTemplate, codexReaderTemplate } from './codex-maintenance-arguments';
import { assertQualifiedLaunch, currentPin, HOST_ENVIRONMENT, substitute, substituteDeep, type HarnessBindings, type LaunchBindings, type MaintenanceProvider, type QualificationEnvironment, type QualifiedLaunch } from './launch-qualification';
import { policyId, type MaintenanceLaunchPolicy } from './maintenance-launch';
import type { LaunchTemplate } from './maintenance-template';

/** The template a provider and policy launch with. A Claude checks or Codex editor launch does not exist. */
export function templateFor(provider: MaintenanceProvider, policy: Pick<MaintenanceLaunchPolicy, 'kind' | 'browser' | 'registry'>, roots: ProtectedRoots): LaunchTemplate {
    if (provider === 'claude' && policy.kind === 'reader') return claudeReaderTemplate();
    if (provider === 'claude' && policy.kind === 'editor') return claudeEditorTemplate(roots, policy.registry ?? []);
    if (provider === 'codex' && policy.kind === 'reader') return codexReaderTemplate();
    if (provider === 'codex' && policy.kind === 'checks') return codexChecksTemplate(!!policy.browser);
    throw new Error(`No ${provider} ${policy.kind} maintenance launch is defined`);
}

export interface InvocationInput {
    dataRoot: string;
    stage: string;
    provider: MaintenanceProvider;
    policy: MaintenanceLaunchPolicy;
    session: string;
    /** The exact schema JSON the runtime wrote at `schemaPath`. */
    schema: string;
    schemaPath: string;
    /** The private scratch the harness allocated for this assignment (editor and checks). */
    scratch?: string;
    route?: { model: string; effort: string };
    roots: ProtectedRoots;
    environment?: QualificationEnvironment;
}
export interface MaintenanceInvocation {
    program: MaintenanceProvider;
    executablePath: string;
    args: string[];
    /** Where the child starts: the policy's cwd, or the private scratch for a checks runner. */
    spawnCwd: string;
    policyId: string;
    qualified: QualifiedLaunch;
}

const inside = (path: string, root: string) => { const suffix = relative(root, path); return !!suffix && suffix !== '..' && !suffix.startsWith(`..${sep}`) && !isAbsolute(suffix); };

/** The harness's own bindings, checked for shape before they are compared with the qualified template. */
function harnessBindings(input: InvocationInput): HarnessBindings {
    const { policy } = input;
    if (!isAbsolute(policy.cwd) || resolve(policy.cwd) !== policy.cwd) throw new Error('A maintenance launch needs an absolute harness-bound cwd');
    const needsScratch = policy.kind !== 'reader';
    if (needsScratch) {
        const scratch = input.scratch;
        if (!scratch || !isAbsolute(scratch) || resolve(scratch) !== scratch) throw new Error('A maintenance editor or checks launch needs its private scratch');
        const stat = lstatSync(scratch, { throwIfNoEntry: false });
        if (!stat?.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 || readdirSync(scratch).length)
            throw new Error('Maintenance scratch must be a fresh private directory');
        if (inside(scratch, input.dataRoot) || inside(scratch, policy.cwd)) throw new Error('Maintenance scratch must lie outside Office data and the checkout');
    }
    const candidate = policy.candidate;
    if (policy.kind !== 'reader') {
        if (!candidate || candidate.worktree !== policy.cwd) throw new Error('An editor or checks launch is bound to its owned candidate worktree');
        if (policy.kind === 'editor' && (!inside(candidate.gitDir, resolve(candidate.gitCommonDir, 'worktrees')) || !/^[\w./-]+$/.test(candidate.branch) || candidate.branch.includes('..')))
            throw new Error('The editor needs its own linked-worktree administrative directory and branch');
    }
    return {
        session: input.session, schemaPath: input.schemaPath, cwd: policy.cwd,
        ...(needsScratch ? { scratch: input.scratch } : {}),
        ...(policy.kind === 'editor' ? { gitDir: candidate!.gitDir, gitCommonDir: candidate!.gitCommonDir, branchRef: `refs/heads/${candidate!.branch}` } : {}),
    };
}

/**
 * The final invocation of one qualified maintenance worker: the current pinned executable, the template with the
 * harness-bound values written in, and the qualification that admits it. Throws `LaunchQualificationRefusal` before
 * anything is started when the record does not match exactly.
 */
export function maintenanceInvocation(input: InvocationInput): MaintenanceInvocation {
    const harness = harnessBindings(input), template = templateFor(input.provider, input.policy, input.roots);
    if (input.provider === 'codex' && !input.route) throw new Error('A Codex maintenance launch needs an explicit model and effort');
    const bindings: LaunchBindings = { ...harness, ...(input.provider === 'claude' ? { schema: input.schema } : {}),
        ...(input.route ? { model: input.route.model, effort: input.route.effort } : {}) };
    const args = template.arguments.map(arg => substitute(arg, bindings));
    const id = policyId(input.provider, input.policy), executablePath = currentPin(input.provider).path;
    const qualified = assertQualifiedLaunch({ dataRoot: input.dataRoot, stage: input.stage, policy: id, provider: input.provider, executablePath,
        template, args, settings: substituteDeep(template.settings, bindings), bindings, harness }, input.environment ?? HOST_ENVIRONMENT);
    return { program: input.provider, executablePath, args, spawnCwd: input.policy.kind === 'checks' ? input.scratch! : input.policy.cwd, policyId: id, qualified };
}
