import { resolve } from 'node:path';
import type { OfficeSnapshot } from '../../src/shared';
/** Permit only referenced QA artifacts, not arbitrary files in a GitHub job directory. */
export function referencedQAArtifact(state: OfficeSnapshot, path: string): boolean {
    const results = [...state.tickets.flatMap(t => [...Object.values(t.results), ...(t.qaHistory || []).map(h => h.result)]),
        ...(state.coordination?.jobs || []).flatMap(j => j.steps.filter(s => s.stage === 'validate').map(s => s.result))];
    return results.some(r => r && (r.qaRunDir && resolve(r.qaRunDir, 'report.json') === path || r.evidence.some(e => e.path === path)));
}
