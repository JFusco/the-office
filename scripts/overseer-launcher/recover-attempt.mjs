// What an earlier launch left in `current`: settled before anything else, with each attempt
// counted at most once.
import { attemptRecord, settle } from './launcher-state.mjs';
import { LIMITS } from './limits.mjs';
import { groupInventory, leaderMatches, observation, probeGroup, stopGroup } from './process-group.mjs';

/**
 * Returns the state and whether a new pass may start. An unregistered start, a group that cannot
 * be probed or identified, or one that will not stop keeps `current` and blocks. A group gone
 * without settling is `lost`; one still running and ours is stopped as an `orphan`. An attempt
 * already counted is never counted again. Only ESRCH clears a registered attempt.
 */
export async function recoverCurrent(state, system, launcherFile, limits = LIMITS) {
    const current = state.current, at = system.now().toISOString();
    if (!current) return { state, blocked: false };
    if (current.phase === 'starting') return { state: { ...state, current: { ...current, observation: observation(at, 'an earlier launch was interrupted before its helper was registered; inspect before clearing', null) } }, blocked: true };
    const charge = (base, kind, detail) => current.counted ? base : settle(base, attemptRecord(current.id, kind, current.startedAt, at, { detail }));
    const probe = probeGroup(system, current.pid, current.pgid);
    if (probe === 'unknown') return { state: { ...state, current: { ...current, observation: observation(at, 'the recorded group cannot be probed', null) } }, blocked: true };
    if (probe === 'absent') return { state: { ...charge(state, 'lost', 'an earlier launch ended without settling its pass'), current: null }, blocked: false };
    const inventory = await groupInventory(system, current.pgid);
    if (!inventory.ok || !leaderMatches(inventory, current, launcherFile))
        return { state: { ...state, current: { ...current, observation: observation(at, inventory.ok ? 'the recorded group’s leader is not this attempt’s helper; left alone' : inventory.reason, inventory) } }, blocked: true };
    const charged = charge(state, 'orphan', 'an earlier launch left its pass running');
    const counted = current.counted ?? 'orphan';
    const stopped = await stopGroup(system, current, launcherFile, limits);
    if (!stopped.gone) return { state: { ...charged, current: { ...current, counted, observation: stopped.observation } }, blocked: true };
    return { state: { ...charged, current: null }, blocked: false };
}
