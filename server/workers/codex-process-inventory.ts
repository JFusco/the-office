import type { LiveSession } from './session-bridge';

/** Every Codex PID in one native lsof read, with the rollout transcripts each holds open. */
export interface CodexProcessInventory { pids: number[]; rollouts: Map<string, number[]> }
/** Loaded sessions plus the process identities that no verified session or Office worker explains. */
export type DesktopSessions = LiveSession[] & { unaccounted: number[] };

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

/** A PID is covered only by a verified transcript it holds or a registered running Office worker. Command lines are never trusted. */
export function unaccountedProcesses(inventory: CodexProcessInventory, verified: ReadonlySet<string>, workers: ReadonlySet<number>): number[] {
    const covered = new Set(workers);
    for (const [path, holders] of inventory.rollouts) if (verified.has(path)) for (const pid of holders) covered.add(pid);
    return inventory.pids.filter(pid => !covered.has(pid));
}

/** Account for every process before deduplicating descriptors into one session per transcript. Missing metadata throws in `load`. */
export function accountCodexProcesses(raw: string, load: (path: string) => LiveSession | null, workers: ReadonlySet<number>): DesktopSessions {
    const inventory = codexProcessInventory(raw), verified = new Set<string>(), sessions: LiveSession[] = [];
    for (const path of inventory.rollouts.keys()) {
        const session = load(path);
        verified.add(path);
        if (session) sessions.push(session);
    }
    return Object.assign(sessions, { unaccounted: unaccountedProcesses(inventory, verified, workers) });
}
