import { knowledgeSection, knowledgeEvent } from './presentation';
import type { KnowledgeActivity } from '../contracts/knowledge-views';
import { Button, Tag } from '../ui';
/** Dated history is separate from current queue and publication status. */
export function ActivityTimeline({events,onAssignment,onDigest}:{events:KnowledgeActivity[];onAssignment:(id:string)=>void;onDigest:(id:string)=>void}) {
    const groups=new Map<string,KnowledgeActivity[]>();
    for(const event of events){const day=new Date(event.at).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});groups.set(day,[...(groups.get(day)||[]),event]);}
    return <section data-knowledge-section className={knowledgeSection} aria-labelledby="activity-history"><h3 id="activity-history">Recent history</h3><p className="text-12 text-muted">Dated events, newest first. Select an event to inspect its evidence.</p>
        {!events.length&&<p className="my-4">No recorded activity in this project scope.</p>}
        <ol aria-label="Learning timeline">{[...groups].map(([day,items])=><li key={day}><h4 className="mt-6 mb-2 text-12 font-emphasis text-muted">{day}</h4><ol>{items.map(event=><li key={event.id} className={knowledgeEvent}><div><Tag>{event.kind}</Tag></div><div className="min-w-0 wrap-anywhere"><h4 className="mb-1.5 text-15 font-bold">{event.title}</h4><p className="text-14 leading-relaxed">{event.detail}</p>{event.assignmentId&&<Button className="mt-3" onClick={()=>onAssignment(event.assignmentId!)}>Inspect assignment knowledge</Button>}{event.digestId&&<Button className="mt-3" onClick={()=>onDigest(event.digestId!)}>Inspect weekly review</Button>}</div><time className="text-right text-12 text-muted max-compact:text-left" dateTime={event.at}>{new Date(event.at).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</time></li>)}</ol></li>)}</ol>
    </section>;
}
