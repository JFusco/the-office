import type { KnowledgeContext } from '../context';
import type { MergeNotice } from '../../../src/shared';
import { noticeState } from '../../conversations/notifications';
import { digestKnowledge } from './private-body';
import { knowledgeScopeRevision } from '../knowledge-snapshot';
import { retainOutboundBody,outboundBody } from './outbound-body';
import { digest } from '../digest';
import type { Store } from '../../store/store';

/** Queue metadata only; the frozen message stays in a private home-owned table. */
export function queueOutboundDigests(context:KnowledgeContext,project:string):number {
    const store=context.stores.get(project),policy=store?.state.knowledge?.digestDelivery;
    if(!store||!policy?.enabled||!policy.enabledAt||store.state.paused||store.state.draining)return 0;
    const notices=noticeState(store).entries;let count=0;
    for(const record of store.state.knowledge!.digests||[]) {
        if(record.at<policy.enabledAt)continue;
        const id=`knowledge-slack:${record.id}`;if(notices.some(n=>n.id===id))continue;
        const detail=digestKnowledge(context,project,record.id);if(!detail)continue;
        let text=detail.text;if(text.length>4700){let end=text.lastIndexOf('\n',4700);if(end<3000)end=4700;if(/[\uD800-\uDBFF]/.test(text[end-1]))end--;text=text.slice(0,end)+'\n\nSee this project’s Brain Activity view for the complete review.';}
        store.transaction(()=>{
            const textSha256=retainOutboundBody(store,id,text);
            notices.push({id,event:id,key:'',identity:policy.channelId,email:'',text:'',kind:'knowledge-digest',digestId:record.id,policyVersion:policy.version,textSha256,workspaceOrigin:policy.workspace,sourceScopeRevision:knowledgeScopeRevision(context.registry,project,store.state.knowledge),createdAt:store.clock.now().toISOString(),status:'queued',detail:'Weekly knowledge digest queued for verified channel lookup.'});store.save();
        });count++;
    }
    return count;
}
export function digestNoticeRequest(context:KnowledgeContext,project:string,notice:MergeNotice,working=false) {
    const store=context.stores.get(project),policy=store?.state.knowledge?.digestDelivery;
    if(!store||notice.kind!=='knowledge-digest'||!policy?.enabled||policy.version!==notice.policyVersion||store.state.paused||store.state.draining||notice.sourceScopeRevision!==knowledgeScopeRevision(context.registry,project,store.state.knowledge)||!digestKnowledge(context,project,notice.digestId))return;
    if(working&&notice.status!=='working')return;
    const text=outboundBody(store,notice.id,notice.textSha256);if(!text||digest(text)!==notice.textSha256)return;
    return {targetType:'channel' as const,targetId:policy.channelId,targetName:policy.channelName,workspaceId:policy.workspaceId,text};
}
export function digestNoticeNeverDispatched(store:Store,notice:MergeNotice):boolean {
    return notice.kind==='knowledge-digest'&&!store.getEffect(`slack:${notice.id}`)&&!store.state.slackDeliveries?.some(d=>d.requestId===notice.id);
}
