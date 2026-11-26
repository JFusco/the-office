// The small field validators the launcher's contracts share.
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const SHA = /^[0-9a-f]{40}$/;
export const DIGEST = /^[0-9a-f]{64}$/;
export const MAX_PID = 2_147_483_647;

export const isIso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/.test(value) && Number.isFinite(Date.parse(value));
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
