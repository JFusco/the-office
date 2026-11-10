import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { capturePage } from '../../../../server/knowledge/activity/captures';
import { CommittedBrain } from '../../../../server/knowledge/brain/reader';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import type { BrainCaptureReceipt } from '../../../../server/knowledge/brain/reader';
function fixture(){
 const f=intakeFixture(),receipts=new Map<string,BrainCaptureReceipt>(),ids=Array.from({length:6},(_,i)=>`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`),commit='a'.repeat(40),path='knowledge/tooling/published.md';
 for(const [i,id] of ids.entries()){
  f.ledger.put('proposal',id,{id,status:'captured',hash:digest(id),domain:'tooling',sourceId:f.source.id,receipt:{id:`candidate-${i}`},body:'PRIVATE_CANDIDATE_TEXT'});
  receipts.set(id,{version:1,requestId:id,found:true,id:`candidate-${i}`,inputSha256:digest(id),domain:'tooling',currentStatus:'pending',disposition:i===0?{as:'accepted',at:'2026-11-09T22:56:58.891Z',pr:372,mergeCommit:commit}:i===1?{as:'rejected',at:'2026-11-09T23:00:00Z'}:i===2?{as:'superseded',at:'2026-11-09T23:00:00Z'}:null,lineage:'unknown',publications:[]});
 }
 const calls:string[]=[];
 const brain=new CommittedBrain('/fixture',async(_program,args)=>{const id=args.at(-1)!;calls.push(id);return JSON.stringify(receipts.get(id));});
 const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain};return {...f,context,receipts,ids,commit,path,calls};
}
it('uses actual-shaped disposition metadata through the CLI adapter and paginates every older request without reading candidate bodies',async()=>{const f=fixture();try{
 const page=await capturePage(f.context,'brain');expect(page.captures.map(r=>r.reviewStatus)).toEqual(['accepted','rejected','superseded','pending']);expect(page.captures[0]).toMatchObject({intakeStatus:'captured',lineage:'unknown',acceptance:{pr:372,url:'https://github.com/JFusco/brain/pull/372',mergeCommit:f.commit}});expect(page.captures[0].notes).toEqual([]);expect(f.calls).toHaveLength(4);
 const next=await capturePage(f.context,'brain',page.next!);expect(next.captures.map(r=>r.requestId)).toEqual(f.ids.slice(4));expect(next.next).toBeNull();expect(JSON.stringify({page,next})).not.toContain('PRIVATE_CANDIDATE_TEXT');expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
 await expect(capturePage(f.context,'brain','not-a-cursor')).rejects.toThrow('Invalid capture page');
}finally{f.close();}});
it('verifies every receipt binding, hides revoked references after awaited reads and bounds selected mapping metadata',async()=>{const f=fixture();try{
 const first=f.receipts.get(f.ids[0])!;first.lineage='mapped';first.publications=[{path:f.path,commit:f.commit,contentSha256:digest('Published bytes')}];
 const page=await capturePage(f.context,'brain'),selected=await capturePage(f.context,'brain','',page.captures[0].detailCursor);expect(selected.captures[0].noteCount).toBe(1);expect(selected.captures[0].notes[0].reference).toMatchObject({kind:'brain',snapshot:f.commit,path:f.path});expect(selected.next).toBeNull();expect(Buffer.byteLength(JSON.stringify(selected))).toBeLessThanOrEqual(65536);
 for(const field of ['requestId','id','inputSha256','domain'] as const){const original=first[field];(first as unknown as Record<string,unknown>)[field]=field==='inputSha256'?'b'.repeat(64):field==='requestId'?crypto.randomUUID():'wrong';expect((await capturePage(f.context,'brain')).captures[0].reviewStatus).toBe('unavailable');(first as unknown as Record<string,unknown>)[field]=original;}
 first.currentStatus='quarantined';expect((await capturePage(f.context,'brain')).captures[0]).toMatchObject({reviewStatus:'quarantined',notes:[]});first.currentStatus='pending';
 f.context.brain.captureReceipt=async id=>{f.registry.subscribe(f.source.id,'brain',false);return f.receipts.get(id)!;};const revoked=await capturePage(f.context,'brain');expect(revoked.captures).toEqual([]);expect(revoked.next).toBeNull();expect(JSON.stringify(revoked)).not.toContain(f.source.title);
}finally{f.close();}});
