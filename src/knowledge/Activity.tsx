import { knowledgeSection } from './presentation';
import { KnowledgeReveal } from './KnowledgeReveal';
import { PanelHeader } from '../ui/PanelHeader';
import { ChartColumn } from '../ui/icons';
import { Button, mutedCopy } from '../ui';
import type { KnowledgeActivityPage } from '../contracts/knowledge-views';
import { useKnowledgeView } from './useKnowledgeView';
import { useState } from 'react';
import { AssignmentKnowledge } from './AssignmentKnowledge';
import { ActivityTimeline } from './ActivityTimeline';
export function Activity({ project }: { project: string }) {
    const { data,error,refresh,refreshing } = useKnowledgeView<KnowledgeActivityPage>(project,'activity');
    const [selected,setSelected]=useState('');
    return <section aria-labelledby="activity-heading">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-section-gap"><div><PanelHeader id="activity-heading" icon={<ChartColumn size={26}/>}>Activity</PanelHeader><p className="max-w-reading-copy text-14 leading-relaxed text-muted">What Harper curated, what the team was given and looked up, and what accepted results cited. History, not a score.</p></div><div className="flex flex-wrap gap-control-gap"><Button disabled={refreshing} onClick={()=>{setSelected('');refresh();}}>Refresh activity</Button></div></div>
        {error&&<p role="alert">{error}</p>}{refreshing&&<p role="status">Updating activity…</p>}
        <KnowledgeReveal ready={!!data||!!error} label="Loading learning activity…">{data&&<>
            <section data-knowledge-section className={knowledgeSection} aria-labelledby="activity-summary"><h3 id="activity-summary">Knowledge use</h3><p className="text-12 text-muted">Recorded knowledge-use totals in this project. General application remains unknown.</p><dl className="mt-4 grid grid-cols-3 gap-4 max-compact:grid-cols-1">{[['Supplied',data.supplied,'Included in an assignment'],['Retrieved',data.retrieved,'Explicitly looked up'],['Cited',data.verified,'Cited by an accepted result']].map(([label,value,detail])=><div key={String(label)} className="border-l-2 border-section-rule pl-4"><dt className="text-12 font-emphasis">{label}</dt><dd><strong className="my-2 block font-heading text-26">{value??'Unavailable'}</strong><p className="text-12 text-muted">{detail}</p></dd></div>)}</dl></section>
            {selected&&<AssignmentKnowledge key={selected} project={project} id={selected}/>}
            <ActivityTimeline events={data.events} onAssignment={setSelected}/>
            <details className="text-12 text-muted"><summary>Activity coverage and counting</summary>{data.limitations.map(x=><p className="my-2 max-w-reading-copy" key={x}>{x}</p>)}{data.truncated&&<p>Only the latest 50 permitted events are shown.</p>}</details>
        </>}</KnowledgeReveal>
    </section>;
}
