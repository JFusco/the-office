import type { Store } from '../../store/store';
import type { KnowledgeContext } from '../context';
import { digestNoticeRequest } from './outbound';
/** Recheck frozen send authority after asynchronous worker probes, immediately before launch. */
export function assertDigestDispatch(store:Store,context:KnowledgeContext|undefined,requestId:string|undefined,stage:string|undefined):void {
    if(stage!=='slack-send'||!requestId)return;
    const notice=store.state.coordination?.notices?.entries.find(n=>n.id===requestId);
    if(notice?.kind==='knowledge-digest'&&(!context||!digestNoticeRequest(context,store.project.id,notice,true)))throw Error('Knowledge digest authorization changed before worker dispatch');
}
