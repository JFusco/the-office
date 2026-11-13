import { withoutIdentifiers } from '../office/without-identifiers';
import type { ITFollowUp, ITState } from '../shared';
import { mutedCopy, summary } from '../ui';
import { itFollowUpView, sessionVisibilityCopy } from './it-follow-up-view';

const card = 'mt-2.5 rounded-7 bg-health-next p-2.5 text-11 leading-body text-health-next-ink';
const date = (value: string) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Not recorded';

export function ITFollowUps({ it, followUps }: { it: ITState; followUps: ITFollowUp[] }) {
    const view = itFollowUpView(it, followUps);
    const retired = it.investigations?.filter(entry => entry.retirement) || [];
    return <>
        {retired.length ? <details className={card} data-retired-investigations><summary className={summary}>{retired.length} historical warnings acknowledged by Joe</summary>
            <p>Retired as incomplete history. Their causes remain unresolved; no fix or successful original outcome is claimed.</p>
            {retired.map(entry => <article key={entry.id} className="mt-2"><strong>{entry.source.ticket || 'Worker shutdown'}</strong><p>{entry.retirement!.reason}</p><p>{entry.attempts} diagnosis attempts retained. Original status: {entry.status}.</p></article>)}
        </details> : null}
        {view.current.map(followUp => {
            const copy = sessionVisibilityCopy(followUp, it.projectId);
            return <article className={card} key={followUp.id}>
                <strong>{copy?.title || `Next owner: ${followUp.owner}`}</strong>
                <p>{copy?.explanation || followUp.detail}</p>
                {copy ? <><p className="mt-2">{copy.next}</p><details className="mt-2"><summary className={summary}>Technical details</summary><p>{followUp.detail}</p></details></> : null}
            </article>;
        })}
        {view.investigations.length ? <section className={card} aria-label="Unresolved worker investigations">
            <strong>{view.investigations.length} earlier worker {view.investigations.length === 1 ? 'investigation remains' : 'investigations remain'} unresolved</strong>
            <p>Ellis could not verify a safe fix for helper processes left behind by earlier worker runs. Morgan coordinates the evidence review with Office and provider maintainers. Delivery status is checked separately.</p>
            <p className="mt-2">No action is requested from you. These cases retain their original reports and attempt limits.</p>
            <details className="mt-2"><summary className={summary}>View investigation records</summary>
                {view.investigations.map(({ followUp, entry }) => <article className="mt-3 border-t border-it-rule pt-3" key={entry.id}>
                    <strong>{entry.source.ticket || 'Worker'} · shutdown investigation</strong>
                    <p>Needs more evidence · Owner: {followUp.owner}</p>
                    <p className={mutedCopy}>Investigation updated: {date(entry.updatedAt)}. {entry.attempts} of 3 diagnosis attempts used.</p>
                    <p className="mt-2">Next: Morgan reviews the saved evidence with the maintainers before a fix or further diagnosis.</p>
                    <details className="mt-2"><summary className={summary}>Original diagnostic</summary><p>{withoutIdentifiers(followUp.detail)}</p></details>
                </article>)}
            </details>
        </section> : null}
    </>;
}
