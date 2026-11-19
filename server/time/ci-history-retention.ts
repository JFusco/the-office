import { archiveHistory, archiveMonth } from '../store/history-archive';
import type { AzureBuild, OfficeSnapshot } from '../../src/shared';

/** How long a finished build keeps its task-level timing in live state. */
export const TASK_DETAIL_DAYS = 7;

/**
 * Moves the task-level timing of old builds out of live state. A build keeps its stage and job records;
 * its full record, tasks included, is appended to the project's monthly archive first. Task records were
 * nine tenths of the CI history and are read only by a collapsed list in the Time Book and as a cache for
 * builds Azure still lists, so a build is left whole while it is recent, in Azure's current list, or a
 * pull request's policy build. A build is trimmed only after its archive write is confirmed; if the write
 * fails nothing changes and the next refresh tries again. Returns how many builds were trimmed.
 */
export function archiveOldTaskDetail(dataRoot: string, state: Pick<OfficeSnapshot, 'ciHistory' | 'azure'>, now: Date, days = TASK_DETAIL_DAYS): number {
    const current = new Set([...state.azure.builds.map(build => build.id), ...state.azure.prs.flatMap(pr => pr.policies.map(policy => policy.buildId))]);
    const cutoff = now.getTime() - days * 86400000;
    const old = (state.ciHistory || []).filter(build => {
        const finished = Date.parse(build.finishedAt || '');
        return Number.isFinite(finished) && finished <= cutoff && !current.has(build.id) && build.stages.some(stage => stage.type === 'Task');
    });
    if (!old.length) return 0;
    const months = new Map<string, AzureBuild[]>();
    for (const build of old) {
        const month = archiveMonth(build.finishedAt, now);
        months.set(month, [...months.get(month) || [], build]);
    }
    try { for (const [month, batch] of months) archiveHistory(dataRoot, 'ci-builds', month, batch); }
    catch { return 0; }
    for (const build of old) build.stages = build.stages.filter(stage => stage.type !== 'Task');
    return old.length;
}
