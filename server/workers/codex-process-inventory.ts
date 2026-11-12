import type { LiveSession } from './session-bridge';

/** Every Codex PID in one native lsof read, with the rollout transcripts each holds open. */
export interface CodexProcessInventory { pids: number[]; rollouts: Map<string, number[]> }
/**
 * Loaded sessions plus the process identities that no verified session or Office worker explains.
 * `besideRuntime` is the same list when Codex's own daemon processes also count as explained,
 * which holds only while the runtime they host answers.
 */
export type DesktopSessions = LiveSession[] & { unaccounted: number[]; besideRuntime?: number[] };
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
 * A PID is covered by a verified transcript it holds, by a registered running Office worker, by being one of the
 * given `hosts`, or by descending from a process that is: a helper a known host started. Command lines are never trusted.
 */
export function unaccountedProcesses(inventory: CodexProcessInventory, verified: ReadonlySet<string>, workers: ReadonlySet<number>, parents: ReadonlyMap<number, number> = new Map(), hosts: readonly number[] = []): number[] {
    const covered = new Set([...workers, ...hosts]);
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
export function accountCodexProcesses(raw: string, load: (path: string) => LiveSession | null, workers: ReadonlySet<number>, parents: ReadonlyMap<number, number> = new Map(), daemon: readonly number[] = []): DesktopSessions {
    const inventory = codexProcessInventory(raw), verified = new Set<string>(), sessions: LiveSession[] = [];
    for (const path of inventory.rollouts.keys()) {
        const session = load(path);
        verified.add(path);
        if (session) sessions.push(session);
    }
    return Object.assign(sessions, { unaccounted: unaccountedProcesses(inventory, verified, workers, parents), besideRuntime: unaccountedProcesses(inventory, verified, workers, parents, daemon) });
}
