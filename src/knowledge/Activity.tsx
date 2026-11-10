import { DigestDetail } from './DigestDetail';
import { DigestSettings } from './DigestSettings';
import { PanelHeader } from '../ui/PanelHeader';
import { ChartColumn } from '../ui/icons';
import { mutedCopy } from '../ui';
import type { KnowledgeActivityPage } from '../contracts/knowledge-views';
import { useKnowledgeView } from './useKnowledgeView';
import { useState } from 'react';
import { Button } from '../ui';
import { AssignmentKnowledge } from './AssignmentKnowledge';
import { ActivityStatus } from './ActivityStatus';
import { CaptureReviews } from './CaptureReviews';
export function Activity({ project }: { project: string }) {
    const { data,error,refresh } = useKnowledgeView<KnowledgeActivityPage>(project,'activity');
    const [selected,setSelected]=useState(''),[digest,setDigest]=useState('');
    return <section aria-labelledby="activity-heading"><PanelHeader id="activity-heading" icon={<ChartColumn size={26}/>}>Activity</PanelHeader><p className={mutedCopy}>Trace admitted evidence, Harper’s curation and knowledge supplied to employee work.</p><DigestSettings project={project}/><Button className="my-4" onClick={()=>{setSelected('');setDigest('');refresh();}}>Refresh activity</Button>
        {error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading learning activity…</p>}{data && <><dl className="my-6 grid grid-cols-3 gap-4">{[['Supplied',data.supplied],['Retrieved',data.retrieved],['Verified',data.verified]].map(([label,value]) => <div key={label} className="rounded-7 border border-drawer-line bg-paper p-5"><dt className="text-11 text-muted">{label}</dt><dd className="mt-2 font-heading text-22">{value ?? 'Unavailable'}</dd></div>)}</dl><div className="my-5 text-11 leading-body text-muted">{data.limitations.map(x => <p key={x}>{x}</p>)}</div><CaptureReviews key={`captures:${project}`} project={project}/><ActivityStatus key={project} project={project} data={data}/>{digest&&<DigestDetail key={digest} project={project} id={digest}/>}{selected&&<AssignmentKnowledge key={selected} project={project} id={selected}/>}<ol aria-label="Learning timeline" className="grid gap-3">{data.events.map(event => <li key={event.id} className="rounded-7 border border-drawer-line bg-paper p-5"><div className="flex justify-between gap-4 text-10 text-muted"><span>{event.kind}</span><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time></div><h3 className="my-2 text-15 font-heading">{event.title}</h3><p className="text-12 leading-body">{event.detail}</p>{event.assignmentId&&<Button className="mt-3" onClick={()=>{setDigest('');setSelected(event.assignmentId!);}}>Inspect assignment knowledge</Button>}{event.digestId&&<Button className="mt-3" onClick={()=>{setSelected('');setDigest(event.digestId!);}}>Inspect weekly review</Button>}</li>)}</ol>{data.truncated && <p role="status">Only the latest 50 permitted events are shown.</p>}{!data.events.length && <p>No recorded activity in this project scope.</p>}</>}
    </section>;
}
