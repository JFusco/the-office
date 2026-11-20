import type { DeployContext } from './deploy-context';
import { until } from './poll-until';
import { ServiceHealth } from './service-http';

/** A later write requires the same verified instance to still serve under this deployment's fence. */
export async function requireVerifiedInstance(ctx: DeployContext, expected: { hash: string; serviceInstanceId: string; tokenDigest: string; operation: string }): Promise<void> {
    const health = ServiceHealth.parse(await ctx.office.health());
    if (health.loadedHash !== expected.hash || health.serviceInstanceId !== expected.serviceInstanceId)
        throw new Error('the service no longer serves the verified target hash and instance');
    if (health.fence.status !== 'held' || health.fence.tokenDigest !== expected.tokenDigest || health.fence.deployment !== expected.operation)
        throw new Error("the verified target no longer holds this deployment's fence");
}

export type LoadedVerification =
    | { ok: true; serviceInstanceId: string; pid: number; observedAt: string }
    | { ok: false; reason: string; pid: number | null };

/**
 * Reads `/api/health` until the started service answers or the deadline passes. Loaded means the
 * expected release hash, a service instance not seen before, and this deployment's fence still held.
 * An answer that names another hash, a known instance or a fence this deployment does not hold fails
 * at once; only silence is waited on.
 */
export async function verifyLoaded(ctx: DeployContext, expect: { hash: string; knownInstances: string[]; tokenDigest: string }): Promise<LoadedVerification> {
    type Read = { health: ServiceHealth | null; reason: string };
    const read = async (): Promise<Read> => {
        let raw: unknown;
        try { raw = await ctx.office.health(); }
        catch (error) { return { health: null, reason: `the service did not answer: ${String(error).slice(0, 200)}` }; }
        const parsed = ServiceHealth.safeParse(raw);
        return parsed.success ? { health: parsed.data, reason: '' } : { health: null, reason: 'the service answered without a readable hash, instance, process and fence' };
    };
    const { health, reason } = await until(ctx, ctx.timings.startDeadlineMs, read, answer => !!answer.health);
    if (!health) return { ok: false, reason, pid: null };
    const refuse = (why: string): LoadedVerification => ({ ok: false, reason: why, pid: health.pid });
    if (health.loadedHash !== expect.hash) return refuse(`the service loaded ${health.loadedHash}, not ${expect.hash}`);
    if (expect.knownInstances.includes(health.serviceInstanceId)) return refuse(`service instance ${health.serviceInstanceId} was already running before the start`);
    if (health.fence.status !== 'held' || health.fence.tokenDigest !== expect.tokenDigest) return refuse(`the started service's fence is ${health.fence.status === 'held' ? `held by ${health.fence.deployment}` : health.fence.status}, not held by this deployment`);
    return { ok: true, serviceInstanceId: health.serviceInstanceId, pid: health.pid, observedAt: ctx.now().toISOString() };
}
