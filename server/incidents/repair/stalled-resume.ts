/** How long a resume may show nothing before it is called stalled. */
export const STALLED_AFTER_MS = 24 * 60 * 60 * 1000;

export interface Quiet {
    /** When the resume was admitted. */
    admittedAt: string;
    /** Instants at which something moved for it: a run of its job or request, a change in how its subject stands. Missing ones are skipped. */
    activity: readonly (string | null | undefined)[];
    /** A wait the Office understands explains the stop right now: a hold, a pause, a provider wait and the like. */
    waiting: boolean;
}

/**
 * When the quiet began, if a resume has shown nothing for 24 hours; null otherwise. The 24 hours
 * are counted from the latest of the admission and the activity given. While a wait applies the
 * resume is not called stalled, but the time spent waiting still counts: a wait that ends because
 * the work moved is activity, and the 24 hours start again there; one that ends with nothing
 * having moved leaves the count where it was, so a resume quiet for longer than that is stalled
 * as soon as the wait is gone. An instant that cannot be read is no activity. Pure.
 */
export function stalledSince({ admittedAt, activity, waiting }: Quiet, now: Date): string | null {
    if (waiting) return null;
    let last = admittedAt;
    for (const at of activity) if (at && Date.parse(at) > Date.parse(last)) last = at;
    return now.getTime() - Date.parse(last) >= STALLED_AFTER_MS ? last : null;
}
