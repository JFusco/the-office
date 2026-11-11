import type { WeeklyRollup } from '../shared';
export function IntakeSummary({ rollup }: { rollup: WeeklyRollup }) {
    const intake = rollup.intake;
    if (!intake) return null;
    return <div className="mt-2 text-11 leading-relaxed" data-intake-summary>
        <p>Slack learning intake · {intake.status}: {intake.reads} read batches completed, {intake.outstanding} outstanding.</p>
        <p>{intake.coverageGaps!==undefined?`${intake.coverageGaps} coverage gaps. `:null}Coverage: {intake.reasons.join(', ')}. Details are in the private intake report.</p>
    </div>;
}
