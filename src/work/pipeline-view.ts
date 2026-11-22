import type { PipelineRun, PipelineStatus } from '../contracts/pipelines';

export interface PipelineRow { id: string; name: string; url: string; label: string; tone: 'blocked' | 'passed' | 'working' | 'neutral'; attention: boolean; run?: PipelineRun; detail: string }

/** "5 min ago", "3 h ago", "2 days ago"; empty when the time is unknown. */
export function ago(at: string, now: number): string {
    const ms = now - Date.parse(at);
    if (!Number.isFinite(ms)) return '';
    const minutes = Math.max(0, Math.round(ms / 60000));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 60 * 36) return `${Math.round(minutes / 60)} h ago`;
    return `${Math.round(minutes / 1440)} days ago`;
}

const settled = (run: PipelineRun) => run.outcome === 'passed' || run.outcome === 'failed' || run.outcome === 'partial';

/**
 * One line per pipeline: what its newest run says, with the pipelines that need a look first.
 * A pull request's failed run is that change's failure, so it is shown without asking for a look.
 */
export function pipelineRows(items: readonly PipelineStatus[], now: number): PipelineRow[] {
    const rows = items.map((p): PipelineRow => {
        const newest = p.runs[0], running = newest?.outcome === 'running';
        const run = running ? newest : p.runs.find(r => settled(r) && !r.pullRequest) || p.runs.find(settled) || newest;
        const base = { id: p.id, name: p.name, url: run?.url || p.url, run, attention: false };
        const detail = run ? [run.branch, ago(run.finishedAt || run.queuedAt, now)].filter(Boolean).join(' · ') : '';
        if (!p.enabled) return { ...base, label: 'Off', tone: 'neutral', detail };
        if (!run) return { ...base, label: 'No runs yet', tone: 'neutral', detail };
        if (running) return { ...base, label: 'Running', tone: 'working', detail };
        if (run.outcome === 'passed') return { ...base, label: run.pullRequest ? 'Passed on a PR' : 'Passing', tone: 'passed', detail };
        if (settled(run)) return run.pullRequest ? { ...base, label: 'Failed on a PR', tone: 'neutral', detail }
            : { ...base, label: run.outcome === 'partial' ? 'Partly failed' : 'Failing', tone: 'blocked', attention: true, detail };
        return { ...base, label: run.outcome === 'cancelled' ? 'Cancelled' : 'Skipped', tone: 'neutral', detail };
    });
    return rows.sort((a, b) => Number(b.attention) - Number(a.attention) || a.name.localeCompare(b.name));
}

export function pipelineHeadline(rows: readonly PipelineRow[]): string {
    const failing = rows.filter(r => r.attention).length;
    if (!rows.length) return '';
    return failing ? `${failing} of ${rows.length} ${failing === 1 ? 'needs' : 'need'} a look` : 'Nothing is failing';
}
