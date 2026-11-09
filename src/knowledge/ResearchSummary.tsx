import type { WeeklyRollup } from '../shared';
import { Tag, TextLink, mutedCopy } from '../ui';
export function ResearchSummary({ rollup }: { rollup: WeeklyRollup }) {
    const metrics = rollup.learning, research = rollup.research;
    const coverage = metrics?.coverage;
    return <div data-research-summary>
        {!coverage ? <p className={mutedCopy}>Legacy report: exposure coverage unavailable.</p> : coverage.status === 'unavailable' ? <p className={mutedCopy}>Learning coverage unavailable for this window. Zero counts do not establish that no activity occurred.</p> : <>
            {coverage.status === 'partial' ? <p className={mutedCopy}>Partial learning coverage: recorded since {coverage.startedAt}.</p> : null}
            <p className={mutedCopy}>Recorded assignments: {metrics!.assignments}. Eligible: {metrics!.eligibleAssignments}. Supplied guidance: {metrics!.exposedAssignments}/{metrics!.eligibleAssignments} assignments; {metrics!.exposedPairs}/{metrics!.eligiblePairs} lesson pairs. Omitted: {metrics!.omittedPairs}. Application unknown: {metrics!.applicationUnknown}. Source-verified blockers: {metrics!.resolved}; unresolved: {metrics!.unresolved}; unknown: {metrics!.unknown}.</p>
        </>}
        {rollup.researchId ? <><Tag>Weekly research · {research?.status || 'pending'}</Tag><p className={mutedCopy}>External findings are hypotheses. Local applicability remains unknown until checked against local evidence.</p>{research?.findings.map((finding, index) => <p key={index}>{finding}</p>)}{research?.sources.map(source => <p key={source.url}><TextLink href={source.url} target="_blank" rel="noreferrer">{source.claim}</TextLink> · {source.version} · read {source.retrievedAt}</p>)}{research?.unavailable.map((reason, index) => <p key={index}>{reason}</p>)}</> : null}
    </div>;
}
