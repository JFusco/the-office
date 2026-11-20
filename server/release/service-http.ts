import { z } from 'zod';

const Fence = z.discriminatedUnion('status', [
    z.object({ status: z.literal('open') }),
    z.object({ status: z.literal('held'), tokenDigest: z.string().regex(/^[0-9a-f]{64}$/), deployment: z.string().min(1), acquiredAt: z.string() }),
    z.object({ status: z.literal('invalid'), reason: z.string() }),
]);
export type FenceView = z.infer<typeof Fence>;

/** What a deployment needs from `/api/health`. A service that reports no fence is not one a deployment can replace. */
export const ServiceHealth = z.object({
    loadedHash: z.string().regex(/^[0-9a-f]{64}$/),
    serviceInstanceId: z.string().min(1),
    pid: z.number().int().positive(),
    busy: z.boolean(),
    fence: Fence,
});
export type ServiceHealth = z.infer<typeof ServiceHealth>;

export interface OfficeClient {
    /** One fresh `/api/health` read as parsed JSON. Throws when the service does not answer. */
    health(): Promise<unknown>;
    fence(): Promise<FenceView>;
    acquireFence(token: string, deployment: string): Promise<FenceView>;
    releaseFence(token: string): Promise<FenceView>;
}

/** The running Office over loopback HTTP. Every request is bounded; a refusal carries the service's own words. */
export function officeClient(base: string, request: typeof fetch = fetch, timeoutMs = 10_000): OfficeClient {
    const call = async (path: string, body?: unknown): Promise<unknown> => {
        const response = await request(`${base}${path}`, {
            method: body ? 'POST' : 'GET', signal: AbortSignal.timeout(timeoutMs),
            ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`${path} answered ${response.status}: ${text.slice(0, 300)}`);
        return JSON.parse(text);
    };
    const fenceOf = (answer: unknown) => Fence.parse((answer as { fence?: unknown })?.fence);
    return {
        health: () => call('/api/health'),
        fence: async () => fenceOf(await call('/api/deployment-fence')),
        acquireFence: async (token, deployment) => fenceOf(await call('/api/deployment-fence', { action: 'acquire', token, deployment })),
        releaseFence: async token => fenceOf(await call('/api/deployment-fence', { action: 'release', token })),
    };
}
