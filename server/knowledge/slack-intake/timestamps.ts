/** Slack decimal identities must never pass through floating point. */
export function micros(ts: string): bigint {
    if (!/^\d{1,12}\.\d{1,6}$/.test(ts)) throw Error('Invalid Slack timestamp');
    const [seconds, fraction] = ts.split('.');
    return BigInt(seconds) * 1000000n + BigInt(fraction.padEnd(6, '0'));
}
export function timestamp(value: bigint): string {
    const v = value < 0n ? 0n : value;
    return `${v / 1000000n}.${String(v % 1000000n).padStart(6, '0')}`;
}
export const compareTs = (a: string, b: string): number => micros(a) < micros(b) ? -1 : micros(a) > micros(b) ? 1 : 0;
export const overlapTs = (ts: string, amount = 1n): string => timestamp(micros(ts) - amount);
export const nowTs = (now: Date): string => timestamp(BigInt(now.getTime()) * 1000n);
