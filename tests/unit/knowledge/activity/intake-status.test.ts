import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { intakeActivity } from '../../../../server/knowledge/activity/intake-status';

it('projects source-bound collection metadata without bodies',()=>{
    const f=intakeFixture();try {
        f.ledger.put('proposal','original',{id:'original',status:'captured',body:'PRIVATE CANDIDATE',hash:'original-hash'});
        const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'',search:async()=>[],read:async()=>({text:'',contentSha256:''})}};
        const rows=intakeActivity(context,'brain');
        expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({kind:'collection',status:'pending',queuedAt:f.task.createdAt});
        expect(JSON.stringify(rows)).not.toContain('PRIVATE CANDIDATE');expect(intakeActivity(context,'cec')).toEqual([]);
        f.registry.update(f.source.id,f.source.revision,s=>{s.state='withdrawn';});expect(intakeActivity(context,'brain')).toEqual([]);
    }finally{f.close();}
});
