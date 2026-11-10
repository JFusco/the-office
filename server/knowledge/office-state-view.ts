import type { OfficeSnapshot } from '../../src/shared';
import type { Store } from '../store/store';
import type { SourceRegistry } from './sources/registry';
import { knowledgeSnapshot } from './knowledge-snapshot';
import { revokedSubjects,deniedAssignments } from './sources/retained-scope';
import { eventVisible } from './events/visibility';
/** Retained replies and notes inherit their original assignment/digest scope. Audit state stays intact. */
export function knowledgeOfficeState(registry:SourceRegistry,project:string,state:OfficeSnapshot,officeWide = false):OfficeSnapshot {
    const knowledge=knowledgeSnapshot(registry,project,state.knowledge),allowed=new Set(knowledge?.exposures?.map(e=>e.id)||[]),blocked=new Set<string>();
    const deniedAttempts = new Set(deniedAssignments(registry,project,state,officeWide));
    for(const e of state.knowledge?.exposures||[])if(!allowed.has(e.id)||deniedAttempts.has(e.id)){const work=state.workLog?.find(w=>w.id===e.id);if(work?.requestId)blocked.add(work.requestId);}
    const digests=new Set(knowledge?.digests?.map(d=>d.id)||[]);
    for(const d of state.knowledge?.digests||[])if(!digests.has(d.id)||officeWide&&d.sourceBindings.some(b=>!b.approvedTextOnly))blocked.add(d.messageId);
    const subjects=revokedSubjects(registry,project,state,officeWide),denied=(kind:string,id:string)=>subjects.some(s=>s.kind===kind&&s.id===id);
    const tickets=new Set([...(state.coordination?.jobs||[]).filter(j=>denied('job',j.id)).map(j=>j.key),...state.tickets.filter(t=>denied('ticket',t.runId)).map(t=>t.key)]);
    for(const work of state.workLog||[])if(subjects.some(s=>s.id===work.requestId||`ticket:${s.id}`===work.requestId)||work.ticket&&tickets.has(work.ticket))if(work.requestId)blocked.add(work.requestId);
    for(const s of subjects)blocked.add(s.id);
    const messages=state.messages.filter(m=>!blocked.has(m.requestId)&&!tickets.has(m.ticket));
    const projectNotes=state.projectNotes.filter(n=>!blocked.has(n.requestId)&&!tickets.has(n.ticket));
    return {...state,knowledge,messages,projectNotes,
        events:(state.events||[]).filter(e=>eventVisible(registry,project,e)),
        workLog:state.workLog?.map(w=>deniedAttempts.has(w.id)||blocked.has(w.requestId)?{...w,task:'Work details withheld because source access changed',failure:undefined}:w),
        agents:(state.agents||[]).map(a=>{const work=state.workLog?.slice().reverse().find(w=>w.role===a.id);return work&&(deniedAttempts.has(work.id)||blocked.has(work.requestId))?{...a,task:'Work details withheld because source access changed',lastOutcome:undefined}:a;}),
        tickets:state.tickets.filter(t=>!denied('ticket',t.runId)),coordination:state.coordination?{...state.coordination,jobs:state.coordination.jobs?.filter(j=>!denied('job',j.id))}:undefined,
        maintenance:state.maintenance?{...state.maintenance,runs:state.maintenance.runs.filter(r=>!denied('maintenance',r.id))}:undefined,
        features:state.features?.filter(f=>!denied('feature',f.id)),
        leadershipReports:state.leadershipReports?.filter(r=>!blocked.has(r.requestId)),outbox:state.outbox.filter(a=>!blocked.has(a.id.replace(/^message:/,''))&&!tickets.has(a.ticket))};
}
/** Prompt builders only read this ephemeral view; canonical persistence remains on the owning Store. */
export function knowledgePromptStore(store:Store,registry:SourceRegistry,officeWide = false):Store {
    return Object.create(store,{state:{value:knowledgeOfficeState(registry,store.project.id,store.state,officeWide)}}) as Store;
}

export function knowledgeEntries(entries: import('../scheduling/scheduled-work').OfficeEntry[], registry: SourceRegistry, officeWide = false) {
    return entries.map(entry => ({ ...entry, store: knowledgePromptStore(entry.store, registry, officeWide) }));
}
