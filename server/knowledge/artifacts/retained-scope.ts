import { relative,resolve,sep } from 'node:path';
import { realpathSync } from 'node:fs';
import type { Store } from '../../store/store';
import type { SourceRegistry } from '../sources/registry';
import { exposureBindings } from '../lookup/exposure-bindings';
import { exposureSourceVisible } from '../sources/lesson-visibility';

/** Existing run artifacts inherit the immutable CEC run identity, including after ticket pruning. */
export function retainedArtifactScope(store:Store,registry:SourceRegistry,path:string):{allowed:boolean;private:boolean} {
    const parts=relative(realpathSync(resolve(store.dataRoot,'runs')),realpathSync(path)).split(sep),runId=parts[0];
    const bindings=(store.state.knowledge?.exposures||[]).filter(e=>e.subject?.kind==='ticket'&&e.subject.id===runId).flatMap(e=>exposureBindings(store.state.knowledge,e));
    return {allowed:bindings.every(b=>exposureSourceVisible(registry,store.project.id,b)),private:bindings.length>0};
}
