import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { StageResult } from '../../src/shared';
const contained = (path: string, root: string) => !!path && existsSync(path) && existsSync(root) && realpathSync(path).startsWith(realpathSync(root) + sep);
/** The parsed file, or undefined when it is not JSON. */
const parsed = (text: string): unknown => { try { return JSON.parse(text); } catch { return undefined; } };
/** The value as the result schema would hold it: text trimmed. Key order is not compared. */
const settled = (value: unknown): unknown => typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.map(settled)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, settled(item)])) : value;
/** True for anything shaped like a report the Office saved: a versioned object with its setup. Read loosely so a doubtful file is kept, never replaced. */
const officeReport = (value: any) => !!value && typeof value === 'object' && [1, 2].includes(value.version) && !!value.setup && typeof value.setup === 'object';
/**
 * Harness-owned report; never overwrite a previous result, including a setup failure. A file at the report's
 * path with the same content is that report, whatever its layout or key order; it is saved again in the
 * Office's own layout. One that is not an Office report at all is something a worker
 * left there: it is kept beside the report under another name, and the report is saved.
 */
export function saveQAReport(result: StageResult, directory: string, root: string): void {
    if (!result.qa) return;
    if (result.qaRunDir !== directory || !directory.startsWith(resolve(root) + sep)) throw new Error('Office QA report directory changed');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (!contained(directory, root)) throw new Error('Office QA report directory escaped its assignment');
    const path = resolve(directory, 'report.json'), bytes = JSON.stringify(result.qa, null, 2);
    if (existsSync(path)) {
        if (!contained(path, root)) throw new Error('Prior Office QA report retained; do not overwrite or replay it');
        const existing = parsed(readFileSync(path, 'utf8'));
        if (JSON.stringify(existing) === JSON.stringify(result.qa)) return;
        const same = isDeepStrictEqual(settled(existing), settled(result.qa));
        if (!same && officeReport(existing)) throw new Error('Prior Office QA report retained; do not overwrite or replay it');
        let kept = resolve(directory, 'worker-report.json');
        for (let copy = 2; existsSync(kept); copy++) kept = resolve(directory, `worker-report-${copy}.json`);
        renameSync(path, kept);
    }
    writeFileSync(path, bytes, { flag: 'wx', mode: 0o600 });
}
