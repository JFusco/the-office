import type { KnowledgeContext } from '../context';
import type { SourceUnit } from '../slack-intake/contracts';
import type { SourceRegistry } from '../sources/registry';
import { digest } from '../slack-intake/config';
import { outboundBody } from './outbound-body';
import { comparableSlackText } from '../../conversations/slack';

export interface AuthoredDigest {noticeId:string;origin:string;channelId:string;messageTs:string;permalink:string;textSha256:string;comparisonSha256?:string}
/** Only independently confirmed original Effects receipts establish authorship, never text markers. */
export function reconcileDigestAuthorship(context:KnowledgeContext):boolean {
    const rows=context.registry.meta<AuthoredDigest[]>('authored-knowledge-digests')||[],keys=new Set(rows.map(r=>r.noticeId));let changed=false;
    for(const store of context.stores.values())for(const notice of store.state.coordination?.notices?.entries||[]) {
        if(notice.kind!=='knowledge-digest'||keys.has(notice.id))continue;
        const effect=store.getEffect<{textSha256:string;workspaceId:string;channelId:string}>(`slack:${notice.id}`),delivery=store.state.slackDeliveries?.find(d=>d.requestId===notice.id&&d.status==='confirmed');
        const text=outboundBody(store,notice.id,notice.textSha256);
        if(effect?.status!=='verified'||effect.operation!=='knowledge-digest-slack'||effect.payload.textSha256!==notice.textSha256||!delivery||!text||digest(text)!==notice.textSha256||delivery.workspaceId!==effect.payload.workspaceId||delivery.targetId!==effect.payload.channelId||delivery.channelId!==effect.payload.channelId||!delivery.channelId||!delivery.messageTs||!delivery.permalink)continue;
        const receipt=effect.receipt as {id?:string;channelId?:string;messageTs?:string};
        if(receipt.id!==delivery.id||receipt.channelId!==delivery.channelId||receipt.messageTs!==delivery.messageTs)continue;
        rows.push({noticeId:notice.id,origin:notice.workspaceOrigin,channelId:delivery.channelId,messageTs:delivery.messageTs,permalink:delivery.permalink,textSha256:notice.textSha256,comparisonSha256:digest(comparableSlackText(text))});keys.add(notice.id);changed=true;
    }
    if(changed)context.registry.setMeta('authored-knowledge-digests',rows);
    return changed;
}
export function unitAuthorship(registry:SourceRegistry,origin:string,unit:Pick<SourceUnit,'url'|'channel'|'ts'|'references'>&Partial<Pick<SourceUnit,'text'>>):SourceUnit['authorship'] {
    for(const row of registry.meta<AuthoredDigest[]>('authored-knowledge-digests')||[]) {
        if(row.origin!==origin)continue;
        if(unit.channel===row.channelId&&unit.ts===row.messageTs||unit.url===row.permalink)return {kind:'office-digest',noticeId:row.noticeId};
        if(unit.text&&row.comparisonSha256&&digest(comparableSlackText(unit.text))===row.comparisonSha256&&unit.references?.some(r=>r.id===row.permalink||r.url===row.permalink))return {kind:'identified-repost',noticeId:row.noticeId};
    }
}
