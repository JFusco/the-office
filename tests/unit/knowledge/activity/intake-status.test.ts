import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { intakeActivity } from '../../../../server/knowledge/activity/intake-status';
import { knowledgeActivityPage } from '../../../../server/knowledge/activity/page';

it('projects source-bound collection and original capture metadata without bodies or inferred publication',()=>{
    const f=intakeFixture();try {
        f.ledger.put('proposal','original',{id:'original',status:'captured',body:'PRIVATE CANDIDATE',hash:'original-hash'});
        const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''})}};
        const rows=intakeActivity(context,'brain');
        expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({kind:'collection',status:'pending',queuedAt:f.task.createdAt});
        expect(rows[1]).toMatchObject({kind:'capture',requestId:'original',status:'captured'});expect(rows[1].queuedAt).toBeUndefined();
        expect(JSON.stringify(rows)).not.toContain('PRIVATE CANDIDATE');expect(intakeActivity(context,'cec')).toEqual([]);
        f.registry.update(f.source.id,f.source.revision,s=>{s.state='withdrawn';});expect(intakeActivity(context,'brain')).toEqual([]);
    }finally{f.close();}
});

it('rebuilds Activity after awaited receipt reads and denies revoked source metadata',async()=>{
    const f=intakeFixture();try {
        f.ledger.put('proposal','original',{id:'original',sourceId:f.source.id,status:'captured',body:'PRIVATE CANDIDATE'});
        const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''}),captureReceipt:async()=>{f.registry.update(f.source.id,f.source.revision,s=>{s.state='withdrawn';});return {version:1 as const,requestId:'original',found:false};}}};
        const page=await knowledgeActivityPage(context,'brain');expect(page.intake).toEqual([]);expect(page.publications).toEqual([]);expect(page.publicationLimit).toContain('no publication time is inferred');
        expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
    }finally{f.close();}
});
