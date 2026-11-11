import { useId, useState } from 'react';
import type { Feature } from '../contracts/features';
import { FeatureDelivery } from './FeatureDelivery';
import type { OfficeSnapshot } from '../shared';
import { interactive } from '../ui';
import { officeUrl } from '../shared';
const views = ['Brief', 'Plan', 'Review', 'Delivery'] as const;
export function FeatureDocuments({ feature, snapshot }: { feature: Feature; snapshot?: OfficeSnapshot }) {
    const [view, setView] = useState<typeof views[number]>('Brief'), id = useId();
    const doc = view === 'Brief' ? feature.briefs.at(-1) : view === 'Plan' ? feature.plans.at(-1) : view === 'Review' ? feature.reviewDocuments?.at(-1) : undefined;
    const approval = feature.approvals.find(a => a.featureRevision === feature.revision && (view === 'Brief' ? a.briefDigest : a.planDigest) === doc?.digest);
    const state = approval ? 'Accepted · ' + (approval.authority?.kind === 'policy' || approval.approver === 'policy' ? 'Project policy' : 'Joe') : view === 'Plan' && feature.review?.status === 'complete' && feature.review.acceptedDigest === doc?.digest ? 'Reviewed' : 'Draft';
    return <section aria-label="Living feature document" className="min-w-0">
        <div className="mb-4 flex gap-1" role="tablist" aria-label="Feature document views">{views.map((tab, index) => <button className={interactive + " rounded-6 border border-drawer-line px-3 py-2 aria-selected:bg-roster-hover"} key={tab} id={id + tab} role="tab" type="button" aria-selected={view === tab} aria-controls={id + 'panel'} tabIndex={view === tab ? 0 : -1} onClick={() => setView(tab)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (index + (event.key === 'ArrowRight' ? 1 : 3)) % 4;
            document.getElementById(id + views[next])?.focus();
        }}>{tab}</button>)}</div>
        <div role="tabpanel" id={id + 'panel'} aria-labelledby={id + view} tabIndex={0}>
            {doc ? <><p className="mb-2 text-12 font-bold">{state}</p><a className={interactive + " text-link underline"} href={officeUrl('/api/features/' + feature.id + '/artifacts/' + doc.id, feature.projectId)} target="_blank" rel="noreferrer">Open complete {view.toLowerCase()}</a><article className="mt-4 whitespace-pre-wrap break-words">{doc.markdown}</article></> : view === 'Brief' || view === 'Plan' ? <p>{view} will appear after the team finishes this phase.</p> : null}
            {view === 'Review' && <><h3>Independent plan review</h3><p>{feature.review ? feature.review.status + ' · ' + feature.review.stage : 'Alex’s plan will enter the installed review workflow.'}</p><p>{feature.detail}</p>{feature.review?.researchDigest && <p>Research accepted. Review revision {feature.review.revision}.</p>}</>}
            {view === 'Delivery' && <FeatureDelivery feature={feature} snapshot={snapshot} />}
        </div>
    </section>;
}
