export class IntakeRateLimit extends Error {
    constructor(readonly retryAfter: number) { super('intake-rate-limited'); }
}
export function readRateLimit(result: any): void {
    const data = result?.structured_content ?? result?.structuredContent;
    if (data?.error !== 'ratelimited') return;
    if (!Number.isFinite(data.retry_after) || data.retry_after < 1 || data.retry_after > 86400) throw Error('invalid-provider-backoff');
    throw new IntakeRateLimit(data.retry_after);
}
