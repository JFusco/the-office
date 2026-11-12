import type { LiveSession } from './session-bridge';

/** Every Codex PID in one native lsof read, with the rollout transcripts each holds open. */
export interface CodexProcessInventory { pids: number[]; rollouts: Map<string, number[]> }
/**
 * Loaded sessions plus the process identities that no verified session or Office worker explains.
 * `daemon` names Codex's own registered daemon processes; the runtime inventory answers for them when it connects.
 */
export type DesktopSessions = LiveSession[] & { unaccounted: number[]; daemon?: number[] };

/** Parent process IDs from `ps -axo pid=,ppid=`. Lines that are not two positive integers are skipped. */
export function processParents(raw: string): Map<number, number> {
    const parents = new Map<number, number>();
    for (const line of raw.split('\n')) {
        const [pid, parent] = line.trim().split(/\s+/).map(Number);
        if (Number.isSafeInteger(pid) && pid > 0 && Number.isSafeInteger(parent) && parent > 0) parents.set(pid, parent);
    }
    return parents;
}

export function codexProcessInventory(raw: string): CodexProcessInventory {
    const pids = new Set<number>(), rollouts = new Map<string, number[]>();
    let pid = 0;
    for (const line of raw.split('\n')) {
        if (line[0] === 'p') {
            pid = Number(line.slice(1));
            if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Codex process inventory is malformed');
            pids.add(pid);
        } else if (line[0] === 'n' && line.includes('/.codex/sessions/') && line.endsWith('.jsonl')) {
            if (!pid) throw new Error('Codex process inventory is malformed');
            const path = line.slice(1), holders = rollouts.get(path) || [];
            if (!holders.includes(pid)) holders.push(pid);
            rollouts.set(path, holders);
        }
    }
    return { pids: [...pids], rollouts };
}

/**
 * A PID is covered by a verified transcript it holds, by a registered running Office worker, or by descending from
 * a process that is: a helper a known session host started. Command lines are never trusted.
 */
export function unaccountedProcesses(inventory: CodexProcessInventory, verified: ReadonlySet<string>, workers: ReadonlySet<number>, parents: ReadonlyMap<number, number> = new Map()): number[] {
    const covered = new Set(workers);
    for (const [path, holders] of inventory.rollouts) if (verified.has(path)) for (const pid of holders) covered.add(pid);
    const descends = (pid: number) => {
        const seen = new Set<number>();
        for (let parent = parents.get(pid); parent && !seen.has(parent); parent = parents.get(parent)) {
            if (covered.has(parent)) return true;
            seen.add(parent);
        }
        return false;
    };
    return inventory.pids.filter(pid => !covered.has(pid) && !descends(pid));
}

/** Account for every process before deduplicating descriptors into one session per transcript. Missing metadata throws in `load`. */
export function accountCodexProcesses(raw: string, load: (path: string) => LiveSession | null, workers: ReadonlySet<number>, parents: ReadonlyMap<number, number> = new Map()): DesktopSessions {
    const inventory = codexProcessInventory(raw), verified = new Set<string>(), sessions: LiveSession[] = [];
    for (const path of inventory.rollouts.keys()) {
        const session = load(path);
        verified.add(path);
        if (session) sessions.push(session);
    }
    return Object.assign(sessions, { unaccounted: unaccountedProcesses(inventory, verified, workers, parents) });
}
