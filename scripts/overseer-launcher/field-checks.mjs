// The small field validators the launcher's contracts share. Each takes a parsed JSON value and
// requires its type first: a pattern is never tested against an array or a number coerced to text.
const UUID_FORM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** The z.uuid() of zod 4: an RFC 9562 version and variant, or the nil or max UUID, in either case. */
const RFC_UUID = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
export const MAX_PID = 2_147_483_647;

/** A launcher identifier: the lower-case UUID form the launcher writes and the status reader requires. */
export const isUuid = value => typeof value === 'string' && UUID_FORM.test(value);
/** A pass's own ID, as the runner's PassRecord requires it (z.uuid()). */
export const isRfcUuid = value => typeof value === 'string' && RFC_UUID.test(value);
export const isSha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
export const isDigest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z$/;
/** The z.iso.datetime() of zod 4: UTC, seconds required, any fraction, and a date and time that exist. */
export function isIso(value) {
    const match = typeof value === 'string' && ISO.exec(value);
    if (!match) return false;
    const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, 0);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
        && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second;
}
export const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
/** Every required key present, and no key outside required and optional. */
export const exactKeys = (value, required, optional = []) => isObject(value) && Object.keys(value).every(key => required.includes(key) || optional.includes(key)) && required.every(key => Object.hasOwn(value, key));
export const boundedString = (value, max, min = 0) => typeof value === 'string' && value.length >= min && value.length <= max;
export const isCount = value => Number.isSafeInteger(value) && value >= 0;
/** A process group the launcher may probe or signal: a PID that leads its own group, from 2 through 2147483647. */
export const validPgid = (pid, pgid) => Number.isSafeInteger(pid) && pid === pgid && pid >= 2 && pid <= MAX_PID;
export const errorCode = error => error?.code;
export const message = error => error instanceof Error ? error.message : String(error);
export const bounded = (text, max = 500) => String(text ?? '').slice(0, max);
