/** Parent and start time of every process, from `ps -axo pid=,ppid=,lstart=`. */
export interface ProcessTable { parents: Map<number, number>; started: Map<number, string> }

/** Lines that do not begin with two positive integers are skipped. Start times are whitespace-normalised. */
export function processTable(raw: string): ProcessTable {
    const parents = new Map<number, number>(), started = new Map<number, string>();
    for (const line of raw.split('\n')) {
        const [first, second, ...start] = line.trim().split(/\s+/), pid = Number(first), parent = Number(second);
        if (!Number.isSafeInteger(pid) || pid <= 0 || !Number.isSafeInteger(parent) || parent <= 0) continue;
        parents.set(pid, parent);
        if (start.length) started.set(pid, start.join(' '));
    }
    return { parents, started };
}
