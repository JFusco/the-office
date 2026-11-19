const VERSION = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

function parts(version: string): [number, number, number] {
    const match = version.trim().match(VERSION);
    if (!match) throw new Error(`Unsupported version ${version}`);
    return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
}
function compare(a: string, b: string): number {
    const [x, y] = [parts(a), parts(b)];
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
}

/**
 * Whether a version satisfies a package.json `engines` range made of space-separated comparators
 * (`>=24.14.0 <25`). A short version (`24`, `24.1`) is a wildcard in semver; zero-padding it is exact
 * only for `>=` and `<`, so any other short comparator is refused. Anything else (`||`, `^`, `~`,
 * wildcards) is refused rather than guessed.
 */
export function satisfiesRange(version: string, range: string): boolean {
    const comparators = range.trim().split(/\s+/).filter(Boolean);
    if (!comparators.length) throw new Error('Empty engines range');
    return comparators.every(comparator => {
        const match = comparator.match(/^(>=|<=|>|<|=)?(v?\d+(?:\.\d+){0,2})$/);
        if (!match) throw new Error(`Unsupported engines range ${range}`);
        const operator = match[1] ?? '=';
        if (match[2].replace(/^v/, '').split('.').length < 3 && operator !== '>=' && operator !== '<') throw new Error(`Unsupported engines range ${range}`);
        const order = compare(version, match[2]);
        switch (operator) {
            case '>=': return order >= 0;
            case '<=': return order <= 0;
            case '>': return order > 0;
            case '<': return order < 0;
            default: return order === 0;
        }
    });
}
