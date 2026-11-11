import { knowledgeSection } from './presentation';
import { KnowledgeReveal } from './KnowledgeReveal';
import { DigestDetail } from './DigestDetail';
import { DigestSettings } from './DigestSettings';
import { PanelHeader } from '../ui/PanelHeader';
import { ChartColumn } from '../ui/icons';
import { Button, mutedCopy } from '../ui';
import type { KnowledgeActivityPage } from '../contracts/knowledge-views';
import { useKnowledgeView } from './useKnowledgeView';
import { useState } from 'react';
import { AssignmentKnowledge } from './AssignmentKnowledge';
import { ActivityStatus } from './ActivityStatus';
import { CaptureReviews } from './CaptureReviews';
import { ActivityTimeline } from './ActivityTimeline';
export function Activity({ project }: { project: string }) {
    const { data,error,refresh,refreshing } = useKnowledgeView<KnowledgeActivityPage>(project,'activity');
    const [selected,setSelected]=useState(''),[digest,setDigest]=useState(''),[settings,setSettings]=useState(false);
    return <section aria-labelledby="activity-heading">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-section-gap"><div><PanelHeader id="activity-heading" icon={<ChartColumn size={26}/>}>Activity</PanelHeader><p className="max-w-reading-copy text-14 leading-relaxed text-muted">Follow evidence collection, curation and knowledge used by the team.</p></div><div className="flex flex-wrap gap-control-gap"><Button disabled={refreshing} onClick={()=>{setSelected('');setDigest('');refresh();}}>Refresh activity</Button><Button aria-expanded={settings} aria-controls="activity-settings" onClick={()=>setSettings(v=>!v)}>Activity settings</Button></div></div>
        <div id="activity-settings" hidden={!settings}><DigestSettings project={project}/></div>
        {error&&<p role="alert">{error}</p>}{refreshing&&<p role="status">Updating activity…</p>}
        <KnowledgeReveal ready={!!data||!!error} label="Loading learning activity…">{data&&<>
            <section data-knowledge-section className={knowledgeSection} aria-labelledby="activity-summary"><h3 id="activity-summary">Knowledge use</h3><p className="text-12 text-muted">Recorded assignment totals in this project scope. Supplied knowledge is not proof it was used.</p><dl className="mt-4 grid grid-cols-3 gap-4 max-compact:grid-cols-1">{[['Supplied',data.supplied,'Included in an assignment'],['Retrieved',data.retrieved,'Explicitly looked up'],['Verified',data.verified,'Application independently verified']].map(([label,value,detail])=><div key={String(label)} className="border-l-2 border-section-rule pl-4"><dt className="text-12 font-emphasis">{label}</dt><dd><strong className="my-2 block font-heading text-26">{value??'Unavailable'}</strong><p className="text-12 text-muted">{detail}</p></dd></div>)}</dl></section>
            <ActivityStatus key={project} project={project} data={data}/>
            <div data-knowledge-section className={knowledgeSection}><CaptureReviews key={`captures:${project}`} project={project}/></div>
            {digest&&<DigestDetail key={digest} project={project} id={digest}/>}{selected&&<AssignmentKnowledge key={selected} project={project} id={selected}/>}
            <ActivityTimeline events={data.events} onAssignment={id=>{setDigest('');setSelected(id);}} onDigest={id=>{setSelected('');setDigest(id);}}/>
            <details className="text-12 text-muted"><summary>Activity coverage and counting</summary>{data.limitations.map(x=><p className="my-2 max-w-reading-copy" key={x}>{x}</p>)}{data.truncated&&<p>Only the latest 50 permitted events are shown.</p>}</details>
        </>}</KnowledgeReveal>
    </section>;
}
