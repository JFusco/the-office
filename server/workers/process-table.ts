/** Parent, start time and command line of every process, from `ps -axo pid=,ppid=,lstart=,command=`. */
export interface ProcessTable { parents: Map<number, number>; started: Map<number, string>; commands: Map<number, string[]> }

/** Lines that do not begin with two positive integers are skipped. A start time is the five fields `ps` prints, single-spaced. */
export function processTable(raw: string): ProcessTable {
    const parents = new Map<number, number>(), started = new Map<number, string>(), commands = new Map<number, string[]>();
    for (const line of raw.split('\n')) {
        const [first, second, ...rest] = line.trim().split(/\s+/), pid = Number(first), parent = Number(second);
        if (!Number.isSafeInteger(pid) || pid <= 0 || !Number.isSafeInteger(parent) || parent <= 0) continue;
        parents.set(pid, parent);
        if (rest.length) started.set(pid, rest.slice(0, 5).join(' '));
        if (rest.length > 5) commands.set(pid, rest.slice(5));
    }
    return { parents, started, commands };
}
