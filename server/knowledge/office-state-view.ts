import type { OfficeSnapshot } from '../../src/shared';
import type { Store } from '../store/store';
import { knowledgeSnapshot } from './knowledge-snapshot';

export function knowledgeOfficeState(project:string,state:OfficeSnapshot):OfficeSnapshot {
    return {...state,knowledge:knowledgeSnapshot(project,state.knowledge)};
}
/** Prompt builders only read this ephemeral view; canonical persistence remains on the owning Store. */
export function knowledgePromptStore(store:Store):Store {
    return Object.create(store,{state:{value:knowledgeOfficeState(store.project.id,store.state)}}) as Store;
}

export function knowledgeEntries(entries: import('../scheduling/scheduled-work').OfficeEntry[]) {
    return entries.map(entry => ({ ...entry, store: knowledgePromptStore(entry.store) }));
}
