import { z } from 'zod';

const Health = z.object({
    serviceInstanceId: z.string().min(1),
    busy: z.boolean(),
    fence: z.discriminatedUnion('status', [
        z.object({ status: z.literal('open') }),
        z.object({
            status: z.literal('held'),
            tokenDigest: z.string().regex(/^[0-9a-f]{64}$/),
            deployment: z.string().trim().min(1).max(200),
            acquiredAt: z.iso.datetime(),
        }),
        z.object({ status: z.literal('invalid'), reason: z.string() }),
    ]),
});

export interface IdleObservation { at: string; serviceInstanceId: string }
export type IdleResult =
    | { status: 'idle'; observations: [IdleObservation, IdleObservation] }
    | { status: 'unreachable' | 'unreadable-health' | 'instance-changed' | 'fence-not-held' | 'timeout'; reason: string };

export interface WaitIdleInput {
    /** One fresh read of `/api/health`, parsed JSON. Throws when the service does not answer. A read still pending at the deadline counts as unanswered. */
    observe: () => Promise<unknown>;
    serviceInstanceId: string;
    /** Digest of the token this deployment acquired the fence with. */
    tokenDigest: string;
    deadlineMs: number;
    intervalMs: number;
    sleep?: (ms: number) => Promise<void>;
    now?: () => Date;
}

/**
 * Idle means two consecutive, separately fetched observations of the same service instance, each
 * `busy: false` with this deployment's fence held. The fence makes idleness stable; the two reads
 * confirm it. Anything else is a named refusal: a missing answer never proves that no work ran.
 */
export async function waitIdle(input: WaitIdleInput): Promise<IdleResult> {
    const { sleep = ms => new Promise<void>(done => setTimeout(done, ms)), now = () => new Date() } = input;
    if (![input.deadlineMs, input.intervalMs].every(ms => Number.isFinite(ms) && ms > 0)) throw new Error('waitIdle needs a finite positive deadline and interval');
    const started = now().getTime();
    const timeLeft = (at: Date) => input.deadlineMs - (at.getTime() - started);
    let first: IdleObservation | null = null, busyReason = 'no observation completed';
    const timeout = (): IdleResult => ({ status: 'timeout', reason: first ? 'the deadline passed before a second idle observation' : busyReason });
    for (;;) {
        const remaining = timeLeft(now());
        if (remaining <= 0) return timeout();
        let raw: unknown;
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            raw = await Promise.race([input.observe(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('the health read did not answer before the deadline')), remaining); })]);
        }
        catch (error) { return { status: 'unreachable', reason: String(error).slice(0, 300) }; }
        finally { clearTimeout(timer); }
        const observedAt = now();
        if (timeLeft(observedAt) <= 0) return timeout();
        const parsed = Health.safeParse(raw);
        if (!parsed.success) return { status: 'unreadable-health', reason: 'the service reports no readable instance, busy flag and fence' };
        const health = parsed.data;
        if (health.serviceInstanceId !== input.serviceInstanceId) return { status: 'instance-changed', reason: `the service instance is ${health.serviceInstanceId}, not ${input.serviceInstanceId}` };
        if (health.fence.status !== 'held' || health.fence.tokenDigest !== input.tokenDigest) return { status: 'fence-not-held', reason: `the fence is ${health.fence.status === 'held' ? `held by ${health.fence.deployment}` : health.fence.status}` };
        const observation = { at: observedAt.toISOString(), serviceInstanceId: health.serviceInstanceId };
        if (health.busy) { first = null; busyReason = `the service was busy at ${observation.at}`; }
        else if (first) return { status: 'idle', observations: [first, observation] };
        else first = observation;
        if (timeLeft(now()) <= input.intervalMs) return timeout();
        await sleep(input.intervalMs);
    }
}
