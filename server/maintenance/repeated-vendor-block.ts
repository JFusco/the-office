import type { MaintenanceRun, OfficeSnapshot } from '../../src/shared';

const stoppedInVendorReview = (run: MaintenanceRun) => run.stage === 'vendor-review' && ['blocked', 'interrupted'].includes(run.status);

/**
 * One vendor-review block is Morgan's to retry tomorrow. Two in a row mean the retry is not
 * working and Joe should see it once: the run immediately before this one, by request time,
 * also stopped in vendor review, and no later run has stopped there since (a streak surfaces
 * only its latest run). A pause counts as a stop, so a paused review followed by a real block
 * also surfaces.
 */
export function repeatedVendorReviewBlock(state: Pick<OfficeSnapshot, 'maintenance'>, run: MaintenanceRun): boolean {
    if (!stoppedInVendorReview(run)) return false;
    const others = (state.maintenance?.runs || []).filter(other => other.id !== run.id);
    if (others.some(other => other.requestedAt > run.requestedAt && stoppedInVendorReview(other))) return false;
    const previous = others.filter(other => other.requestedAt < run.requestedAt).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
    return !!previous && stoppedInVendorReview(previous);
}
