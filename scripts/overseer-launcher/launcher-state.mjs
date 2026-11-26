// The launcher's state: one v1 file, which server/overseer/launcher-state.ts reads for status.
// Its contract, reading, saving and the settlement of each attempt into counts and history.
import { isAbsolute } from 'node:path';
import { publishDurable, readOwned } from './durable-files.mjs';
import { boundedString, exactKeys, isCount, isIso, isSha, isUuid, validPgid } from './field-checks.mjs';
import { LIMITS } from './limits.mjs';

export const KINDS = Object.freeze(['success', 'locked', 'interrupted', 'config', 'pin', 'startup', 'exit', 'hang', 'lost', 'orphan']);
export const FAILURE_KINDS = Object.freeze(['config', 'pin', 'startup', 'exit', 'hang', 'lost', 'orphan']);

export const emptyState = () => ({ version: 1, current: null, consecutiveFailures: 0, counts: Object.fromEntries(KINDS.map(kind => [kind, 0])), last: null, recent: [] });

function validObservation(observation) {
    return observation === null || (exactKeys(observation, ['at', 'reason', 'members']) && isIso(observation.at) && boundedString(observation.reason, 500)
        && Array.isArray(observation.members) && observation.members.length <= LIMITS.members
        && observation.members.every(member => exactKeys(member, ['pid', 'pgid', 'start', 'command']) && isCount(member.pid) && isCount(member.pgid) && boundedString(member.start, 40) && boundedString(member.command, LIMITS.command)));
}

function validCurrent(current) {
    if (current === null) return true;
    if (!exactKeys(current, ['id', 'commit', 'entry', 'startedAt', 'deadline', 'phase', 'pid', 'pgid', 'start', 'counted', 'observation'])) return false;
    if (!isUuid(current.id) || !isSha(current.commit) || !boundedString(current.entry, 4096, 1) || !isAbsolute(current.entry) || !isIso(current.startedAt) || !isIso(current.deadline)) return false;
    if (current.counted !== null && !KINDS.includes(current.counted)) return false;
    if (!validObservation(current.observation)) return false;
    if (current.phase === 'starting') return current.pid === null && current.pgid === null && current.start === null;
    return current.phase === 'registered' && validPgid(current.pid, current.pgid) && boundedString(current.start, 40, 1);
}

function validRecord(record) {
    return exactKeys(record, ['id', 'kind', 'startedAt', 'durationMs', 'exit', 'outcome', 'detail']) && isUuid(record.id) && KINDS.includes(record.kind) && isIso(record.startedAt)
        && (record.durationMs === null || isCount(record.durationMs))
        && (record.exit === null || (exactKeys(record.exit, ['code', 'signal']) && (record.exit.code === null || Number.isSafeInteger(record.exit.code)) && (record.exit.signal === null || boundedString(record.exit.signal, 20, 1))))
        && (record.outcome === null || boundedString(record.outcome, 40)) && (record.detail === null || boundedString(record.detail, 500));
}

export function validState(state) {
    return exactKeys(state, ['version', 'current', 'consecutiveFailures', 'counts', 'last', 'recent']) && state.version === 1 && validCurrent(state.current) && isCount(state.consecutiveFailures)
        && exactKeys(state.counts, KINDS) && KINDS.every(kind => isCount(state.counts[kind]))
        && (state.last === null || validRecord(state.last)) && Array.isArray(state.recent) && state.recent.length <= LIMITS.recent && state.recent.every(validRecord);
}

/** The saved state, an empty one when the file is confirmed absent, or a throw: a file that does not validate is left as it is. */
export function readState(paths) {
    const text = readOwned(paths.launcherState, LIMITS.stateMaxBytes);
    if (text === null) return emptyState();
    let state;
    try { state = JSON.parse(text); } catch { throw new Error(`${paths.launcherState} is not JSON`); }
    if (!validState(state)) throw new Error(`${paths.launcherState} is not valid launcher state`);
    return state;
}

export function saveState(paths, state) {
    if (!validState(state)) throw new Error('Refusing to save invalid launcher state');
    publishDurable(paths.launcherState, `${JSON.stringify(state, null, 2)}\n`);
}

/** One attempt's history record. */
export const attemptRecord = (id, kind, startedAt, now, extra = {}) =>
    ({ id, kind, startedAt, durationMs: Math.max(0, Date.parse(now) - Date.parse(startedAt)) || 0, exit: null, outcome: null, detail: null, ...extra });

/** Counts one settled attempt: its kind, the consecutive failures (a success resets them; locked and interrupted keep them) and the bounded history. */
export function settle(state, record) {
    const counts = { ...state.counts, [record.kind]: state.counts[record.kind] + 1 };
    const consecutiveFailures = record.kind === 'success' ? 0 : FAILURE_KINDS.includes(record.kind) ? state.consecutiveFailures + 1 : state.consecutiveFailures;
    return { ...state, counts, consecutiveFailures, last: record, recent: [...state.recent, record].slice(-LIMITS.recent) };
}

/** Fills in what became known about an attempt already counted, on its own history record. */
export function completeRecord(state, id, patch) {
    const update = record => record.id === id ? { ...record, ...patch } : record;
    return { ...state, last: state.last && update(state.last), recent: state.recent.map(update) };
}
