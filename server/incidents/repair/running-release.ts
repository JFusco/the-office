import type { IncidentFix } from '../../../src/contracts/incidents';
import type { ReleaseIdentity } from '../../office/release-identity';
import { compareMemory, comparison } from '../deployed-fixes';
import { watchDeployedFixes, type DeployedFixWatch } from '../watch-deployed-fixes';

/**
 * The verified release the service runs now, when it is known to hold this fix; otherwise null.
 * Known means one of two things: the commit the fix's deployment mark names is the one serving,
 * or GitHub was asked about the commit that serves and said it contains the fix (the remembered
 * answers of deployed-fixes.ts and withdrawn-fixes.ts).
 *
 * A deployment mark alone is not enough. It says what was found when it was made, and for one
 * tick after a rollback, before the withdrawal pass has run, it names a release that no longer
 * serves. An unknown identity, another release nothing was asked about yet, or one GitHub said
 * does not contain the fix, is null.
 */
export function releaseHolding(identity: ReleaseIdentity, fix: Pick<IncidentFix, 'commit' | 'deployed'>, answers: ReadonlyMap<string, boolean>): { commit: string; operation: string } | null {
    if (identity.status !== 'verified' || !fix.deployed) return null;
    const holds = identity.commit === fix.deployed.release.commit || answers.get(comparison(identity.commit, fix.commit)) === true;
    return holds ? { commit: identity.commit, operation: identity.operation } : null;
}

/**
 * The release comparison for a timer to run, and the question the resume pass asks of it, over
 * one set of remembered answers: `compare` asks GitHub (see watch-deployed-fixes.ts) and
 * `holding` reads what it was told, with the identity as it stands at that moment. Made together
 * so the two cannot be given different memories.
 */
export function releaseWatch(input: Omit<DeployedFixWatch, 'memory'>) {
    const memory = compareMemory();
    return { compare: watchDeployedFixes({ ...input, memory }), holding: (fix: Pick<IncidentFix, 'commit' | 'deployed'>) => releaseHolding(input.identity(), fix, memory.answers) };
}
