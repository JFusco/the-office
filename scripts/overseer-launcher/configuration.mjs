// The launcher's settings from its environment: the pass deadline and the Office origin.
import { LIMITS } from './limits.mjs';

/** `OVERSEER_PASS_DEADLINE_MS`: a whole number of milliseconds within the bounds, or a throw. */
export function passDeadline(env, limits = LIMITS) {
    const raw = env.OVERSEER_PASS_DEADLINE_MS;
    if (typeof raw !== 'string' || !/^\d{1,16}$/.test(raw)) throw new Error('OVERSEER_PASS_DEADLINE_MS must be a whole number of milliseconds');
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < limits.minDeadlineMs || value > limits.maxDeadlineMs)
        throw new Error(`OVERSEER_PASS_DEADLINE_MS must be from ${limits.minDeadlineMs} to ${limits.maxDeadlineMs}`);
    return value;
}

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

/** `OVERSEER_OFFICE_URL`, normalized, or undefined: the bare loopback rule of server/overseer/config.ts officeUrl. Never echoes the value. */
export function officeOrigin(env) {
    const raw = env.OVERSEER_OFFICE_URL;
    if (raw === undefined) return undefined;
    let url;
    try { url = new URL(raw); } catch { throw new Error('OVERSEER_OFFICE_URL is not a URL'); }
    if (url.protocol !== 'http:' || !LOOPBACK.has(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || /[?#]/.test(raw))
        throw new Error('OVERSEER_OFFICE_URL must be a bare http: origin on 127.0.0.1, localhost or [::1]');
    return url.origin;
}
