import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { StageResult } from '../../src/shared';
const contained = (path: string, root: string) => !!path && existsSync(path) && existsSync(root) && realpathSync(path).startsWith(realpathSync(root) + sep);
/** Harness-owned report; never overwrite a previous result, including a setup failure. */
export function saveQAReport(result: StageResult, directory: string, root: string): void {
    if (!result.qa) return;
    if (result.qaRunDir !== directory || !directory.startsWith(resolve(root) + sep)) throw new Error('Office QA report directory changed');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    if (!contained(directory, root)) throw new Error('Office QA report directory escaped its assignment');
    const path = resolve(directory, 'report.json'), bytes = JSON.stringify(result.qa, null, 2);
    if (existsSync(path)) {
        if (!contained(path, root) || readFileSync(path, 'utf8') !== bytes) throw new Error('Prior Office QA report retained; do not overwrite or replay it');
    } else writeFileSync(path, bytes, { flag: 'wx', mode: 0o600 });
}
