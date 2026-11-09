import type { WeeklyRollup } from '../shared';
export function IntakeSummary({ rollup }: { rollup: WeeklyRollup }) {
    const intake = rollup.intake;
    if (!intake) return null;
    return <div className="mt-2 text-11 leading-relaxed" data-intake-summary>
        <p>Slack learning intake · {intake.status}: {intake.captures} inbox captures, {intake.duplicates} duplicates, {intake.quarantines} quarantined, {intake.outstanding} outstanding. {intake.coverageGaps !== undefined ? `${intake.coverageGaps} coverage gaps recorded separately.` : ''}</p>
        <p>Coverage: {intake.reasons.join(', ')}. Source-linked examples are in the private intake report.</p>
    </div>;
}
