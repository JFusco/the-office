import type { Store } from '../../store/store';
import type { Role } from '../../../src/shared';
import { currentAssignment } from '../../workers/assignment-context';
import { exposureBindings,requestSourceBindings } from '../lookup/exposure-bindings';

/** Preserve source dependencies before a result summary becomes a durable event. */
export function eventSourceBindings(store:Store,role?:Role,ticket?:string) {
    const claim=currentAssignment()?.claim,knowledge=store.state.knowledge,requests=new Set<string>();
    if(claim?.work.projectId===store.project.id)requests.add(claim.work.id);
    for(const work of store.state.workLog||[])if(claim&&work.claimId===claim.id||ticket&&work.ticket===ticket)requests.add(work.requestId);
    if(!claim&&role){const work=store.state.workLog?.slice().reverse().find(w=>w.role===role&&(!ticket||w.ticket===ticket));if(work)requests.add(work.requestId);}
    const subjects=new Set((store.state.coordination?.jobs||[]).filter(j=>j.key===ticket).map(j=>j.id));
    for(const t of store.state.tickets)if(ticket&&t.key===ticket)subjects.add(t.runId);
    if(claim)subjects.add(claim.work.id);
    const bindings=[...requests].flatMap(id=>requestSourceBindings(store.state,id));
    bindings.push(...(knowledge?.exposures||[]).filter(e=>e.subject&&subjects.has(e.subject.id)).flatMap(e=>exposureBindings(knowledge,e)));
    return [...new Map(bindings.map(b=>[JSON.stringify(b),b])).values()];
}
