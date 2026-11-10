import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { ROOT } from '../../office/config';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';

const sections = [
    { path: 'server/workers/agents.ts', start: '    async sendSlack(', end: '    async verifySlack(' },
    { path: 'server/workers/launch-policy.ts', start: '/** Filesystem capability', end: '\nconst LaunchPolicy' },
    { path: 'server/workers/worker-runtime.ts', start: '            const launchPolicy = workerLaunchPolicy(', end: 'onLine: line => {' },
] as const;
export const INVOCATION_SOURCE_REFS = sections.map(section => `office-source:${section.path}`);

/** Fixed bounded excerpts of CURRENT loaded wiring, never invented historical launch options. */
export function invocationSource(root = ROOT, read = readBoundedNoFollowSync) {
    return sections.flatMap(section => {
        const file = read(resolve(root, section.path), 65536);
        if (!('text' in file) || Buffer.byteLength(file.text) > 65536 || !/^[a-f0-9]{64}$/.test(file.sha256)) return [];
        const start = file.text.indexOf(section.start), end = file.text.indexOf(section.end, start + section.start.length);
        if (start < 0 || end <= start || file.text.indexOf(section.start, start + 1) >= 0) return [];
        const code = file.text.slice(start, end);
        if (Buffer.byteLength(code) > 4000) return [];
        const firstLine = file.text.slice(0, start).split('\n').length;
        return [{ ref: `office-source:${section.path}`, facts: { repository: 'JFusco/the-office', path: section.path,
            provenance: 'current-loaded-source-not-historical-launch', sourceSha256: file.sha256,
            sha256: createHash('sha256').update(code).digest('hex'), firstLine,
            endLine: firstLine + code.split('\n').length - 1, endColumn: code.split('\n').at(-1)!.length, code } }];
    });
}
