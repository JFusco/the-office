import type { ReleaseMarkerCommit, ReleaseMarkerDisposition, ReleaseMarkerStop } from '../../../src/contracts/release-marker';
import type { StopReason } from '../../../src/contracts/work';
import type { TicketJob } from '../../../src/shared';

const short = (sha?: string) => sha ? sha.slice(0, 12) : '';
const list = (paths: string[]) => paths.length > 8 ? `${paths.slice(0, 8).join(', ')} and ${paths.length - 8} more` : paths.join(', ');

function wording(stop: ReleaseMarkerStop): string {
    const lead = stop.disposition === 'return-cap' ? 'A third proven [skip release] package change after two developer returns'
        : stop.disposition === 'interrupted-correction' ? 'A [skip release] message correction was interrupted before it settled'
            : 'A [skip release] commit';
    if (stop.reason === 'marked-package-change')
        return `${lead}${stop.disposition === 'refusal' ? ` ${short(stop.commit)} changes` : ` (${short(stop.commit)}) changes`} shipped npm package files: ${list([...new Set([...stop.paths, ...stop.inventoryPaths])])}. CMS release analysis drops a marked commit, so this change would never be released. Nothing was pushed; a person decides.`;
    return `${lead}${stop.commit ? ` (${short(stop.commit)})` : ''} could not be shown to leave the npm package unchanged: ${stop.diagnostic || 'incomplete coverage'}. Nothing was pushed; a person decides.`;
}

/**
 * A refusal the release-marker check raised (#617). Typed so a stop is classified from the error, never from its
 * wording: `stopReason` copies `evidence` onto the saved stop, and every owner writes `blocked`.
 */
export class ReleaseMarkerRefusal extends Error {
    constructor(public readonly evidence: ReleaseMarkerStop) {
        super(wording(evidence));
    }
}

/** A proven package change by one or more marked commits, oldest first. */
export function packageChange(commits: ReleaseMarkerCommit[], disposition: ReleaseMarkerDisposition = 'refusal', extra: Pick<ReleaseMarkerStop, 'correction' | 'diagnostic'> = {}): ReleaseMarkerRefusal {
    const first = commits[0];
    return new ReleaseMarkerRefusal({ reason: 'marked-package-change', disposition, commit: first?.sha, paths: [...new Set(commits.flatMap(c => c.paths))],
        inventoryPaths: [...new Set(commits.flatMap(c => c.inventoryPaths))], commits: commits.map(c => ({ sha: c.sha, paths: [...c.paths], inventoryPaths: [...c.inventoryPaths] })),
        ...(extra.diagnostic ? { diagnostic: extra.diagnostic } : {}), ...(extra.correction ? { correction: extra.correction } : {}) });
}

/** The check could not prove the marked commits leave the package unchanged. */
export function indeterminate(diagnostic: string, commit?: string, extra: Partial<ReleaseMarkerStop> = {}): ReleaseMarkerRefusal {
    return new ReleaseMarkerRefusal({ reason: 'indeterminate', disposition: 'refusal', paths: [], inventoryPaths: [], diagnostic, ...(commit ? { commit } : {}), ...extra });
}

/** The saved stop for a refusal: its kind, when, and its evidence. */
export function releaseMarkerStop(refusal: ReleaseMarkerRefusal, now: Date): StopReason {
    return { kind: 'release-marker', at: now.toISOString(), releaseMarker: structuredClone(refusal.evidence) };
}

/** Every delivery owner persists a refusal the same way: blocked, with its stop and detail written together. */
export function blockOnReleaseMarker(job: TicketJob, refusal: ReleaseMarkerRefusal, now: Date): void {
    job.status = 'blocked';
    job.stop = releaseMarkerStop(refusal, now);
    job.detail = String(refusal);
}
