import type { WeeklyRollup } from '../shared';
import { mutedCopy } from '../ui';
export function LearningCoverage({ rollup }: { rollup: WeeklyRollup }) {
    const metrics = rollup.learning;
    const coverage = metrics?.coverage;
    return <div data-learning-coverage>
        {!coverage ? <p className={mutedCopy}>Legacy report: exposure coverage unavailable.</p> : coverage.status === 'unavailable' ? <p className={mutedCopy}>Learning coverage unavailable for this window. Zero counts do not establish that no activity occurred.</p> : <>
            {coverage.status === 'partial' ? <p className={mutedCopy}>Partial learning coverage: recorded since {coverage.startedAt}.</p> : null}
            <p className={mutedCopy}>Recorded assignments: {metrics!.assignments}. Eligible: {metrics!.eligibleAssignments}. Supplied guidance: {metrics!.exposedAssignments}/{metrics!.eligibleAssignments} assignments; {metrics!.exposedPairs}/{metrics!.eligiblePairs} lesson pairs. Omitted: {metrics!.omittedPairs}. Source-verified blockers: {metrics!.resolved}; unresolved: {metrics!.unresolved}; unknown: {metrics!.unknown}.</p>
        </>}
    </div>;
}
