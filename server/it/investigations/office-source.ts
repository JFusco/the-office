import { resolve } from 'node:path';
import { ROOT } from '../../office/config';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';

export const OFFICE_SOURCE_PATHS = ['server/workers/process.ts', 'server/workers/lifecycle/process-group.ts', 'server/workers/lifecycle/group-inventory.ts', 'server/workers/lifecycle/recorder.ts', 'server/workers/worker-profiles.ts'] as const;
/** Current loaded Office source only. No model-selected paths, project files or private transcripts. */
export function officeSource(root = ROOT, read = readBoundedNoFollowSync) {
    const evidence: { ref: string; facts: { repository: string; path: string; sha256: string; firstLine: number; code: string } }[] = [];
    let remaining = 24000;
    for (const path of OFFICE_SOURCE_PATHS) {
        if (remaining <= 0) break;
        const file = read(resolve(root, path), Math.min(12000, remaining));
        if (!('text' in file) || Buffer.byteLength(file.text) > remaining || !/^[a-f0-9]{64}$/.test(file.sha256)) continue;
        evidence.push({ ref: `office-source:${path}`, facts: { repository: 'JFusco/the-office', path, sha256: file.sha256, firstLine: 1, code: file.text } });
        remaining -= Buffer.byteLength(file.text);
    }
    return evidence;
}
