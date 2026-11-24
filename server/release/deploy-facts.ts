import { z } from 'zod';

const Commit = z.string().regex(/^[0-9a-f]{40}$/), Digest = z.string().regex(/^[0-9a-f]{64}$/);

/** The steps of a deployment, in order. A rollback reads a deployment's journal against them. */
export const DEPLOY_STEPS = ['fence', 'idle', 'stop', 'backup', 'snapshot', 'plist', 'start', 'verify', 'record', 'release'];

/** What a deployment fixes before its first step. A resumed controller reads these, never the live service, to know its plan. */
export const DeployFacts = z.object({
    kind: z.literal('deploy'),
    /** The pinned release whose tree runs this operation from start to finish. */
    controller: Commit,
    source: z.object({ commit: Commit, directory: z.string(), loadedHash: Digest, serviceInstanceId: z.string().min(1), pid: z.number().int().positive() }),
    target: z.object({ commit: Commit, directory: z.string(), hash: Digest, manifestDigest: Digest }),
    plist: z.object({ path: z.string(), priorSha256: Digest, targetSha256: Digest }),
    tokenDigest: Digest,
});
export type DeployFacts = z.infer<typeof DeployFacts>;

export const RollbackFacts = z.object({
    kind: z.literal('rollback'),
    /** The deployment this operation undoes. */
    of: z.string().min(1),
    reason: z.string(),
    /** Whether the deployment reached the target start step, for diagnosis. */
    started: z.boolean(),
});
export type RollbackFacts = z.infer<typeof RollbackFacts>;

export const DeployStatus = z.enum(['deployed', 'refused', 'aborted', 'rolled-back', 'stopped', 'ended']);
export type DeployStatus = z.infer<typeof DeployStatus>;
/**
 * How an operation ended. `refused`: nothing changed. `aborted`: the fence was taken and released,
 * the service untouched. `rolled-back`: the previous release serves again. `stopped`: a person is needed.
 * `ended`: a person had a deployment's fence released.
 */
export const DeployOutcome = z.object({ status: DeployStatus, operation: z.string().min(1), step: z.string().nullable(), reason: z.string(), rollback: z.string().optional() }).strict();
export type DeployOutcome = z.infer<typeof DeployOutcome>;
