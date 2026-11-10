import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Store } from '../../store/store';
export const DigestSettings = z.object({enabled:z.boolean(),workspace:z.string().url().max(200),workspaceId:z.string().regex(/^T[A-Z0-9]+$/),channelId:z.string().regex(/^[CG][A-Z0-9]+$/),channelName:z.string().trim().min(1).max(100)}).strict().refine(s=>{try{const u=new URL(s.workspace);return u.protocol==='https:'&&u.hostname.endsWith('.slack.com')&&!u.port&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash;}catch{return false;}},'Use the exact HTTPS Slack workspace origin');
/** Outbound authority is separate from collection, merge notifications and internal Morgan reviews. */
export function configureDigestDelivery(store:Store,input:unknown):void {
    const value=DigestSettings.parse(input),knowledge=store.state.knowledge;if(!knowledge)throw Error('Project learning is unavailable');
    const old=knowledge.digestDelivery,workspace=new URL(value.workspace).origin;
    if(old&&JSON.stringify({...value,workspace})===JSON.stringify({enabled:old.enabled,workspace:old.workspace,workspaceId:old.workspaceId,channelId:old.channelId,channelName:old.channelName}))return;
    knowledge.digestDelivery={...value,workspace,version:randomUUID(),enabledAt:value.enabled?store.clock.now().toISOString():''};
    for(const notice of store.state.coordination?.notices?.entries||[])if(notice.kind==='knowledge-digest'&&notice.status==='queued'){notice.status='cancelled';notice.detail='Knowledge digest destination or authorization changed.';}
    store.emit('knowledge-digest-configured',`Weekly knowledge Slack delivery ${value.enabled?'enabled':'disabled'}.`,'pm');
}
