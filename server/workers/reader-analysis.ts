import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Evidence } from '../../src/shared';

export function readerAnalysisReference(id: string, path: string, observedAt: string): Evidence {
    return { id: `reader-analysis:${id}`, kind: 'review', path, summary: 'Original structured reader output, persisted by the Office harness; verdict and findings are unchanged.', commit: '', environment: '', url: '', observedAt };
}
/** Readers return text; only the harness writes and links the original analysis. */
export function persistReaderAnalysis(id: string, stage: string, root: string, result: { summary: string; evidence: Evidence[] }, observedAt: string) {
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const path = resolve(root, `${id}-analysis.md`);
    writeFileSync(path, result.summary, { mode: 0o600, flag: 'wx' });
    for (const item of result.evidence) if (item.kind === 'review' && !item.path) item.path = path;
    if (['plan', 'plan-review', 'code-review', 'repair-review'].includes(stage) && !result.evidence.some(item => item.path === path))
        result.evidence.push(readerAnalysisReference(id, path, observedAt));
}
