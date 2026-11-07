const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;
const parts = (version: string) => STABLE.exec(version)?.slice(1).map(Number);

function compare(a: number[], b: number[]): number {
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
}

/** The highest published stable x.y.z at or above `minimum`, or '' when none is. Prereleases and build tags never qualify. */
export function highestStableAtLeast(versions: string[], minimum: string): string {
    const floor = parts(minimum);
    if (!floor) return '';
    let best: number[] | undefined, found = '';
    for (const version of versions) {
        const current = parts(version);
        if (current && compare(current, floor) >= 0 && (!best || compare(current, best) > 0)) { best = current; found = version; }
    }
    return found;
}
