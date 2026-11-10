import type { Store } from '../../store/store';
import type { SourceRegistry } from './registry';
import type { SessionBridge } from '../../workers/session-bridge';
import { requestSourceBindings } from '../lookup/exposure-bindings';
import { exposureSourceVisible } from './lesson-visibility';

/** Keep ownership facts while withholding retained private worker conversation and display text. */
export function knowledgeSessionVisibility(registry:SourceRegistry,project:string,stores:Iterable<Store>,view:ReturnType<SessionBridge['forProject']>):ReturnType<SessionBridge['forProject']> {
    const ids=new Set<string>(),requests=new Set<string>();
    for(const store of stores)for(const work of store.state.workLog||[]){
        const bindings=requestSourceBindings(store.state,work.requestId);
        if(!bindings.length||store.project.id===project&&bindings.every(b=>exposureSourceVisible(registry,project,b)))continue;
        ids.add(work.id);if(work.sessionId)ids.add(work.sessionId);requests.add(work.requestId);
    }
    const restricted=new Set(view.sessions.filter(s=>ids.has(s.id)||!!s.requestId&&requests.has(s.requestId)).map(s=>s.id));
    return {...view,sessions:view.sessions.map(s=>restricted.has(s.id)?{...s,title:'Worker context withheld because source access is unavailable',context:undefined,rolloutPath:undefined}:s),ownership:{...view.ownership,matches:view.ownership.matches.map(m=>restricted.has(m.id)?{...m,title:'Worker context withheld because source access is unavailable'}:m)}};
}
