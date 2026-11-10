import {expect,test,vi} from 'vitest';
import {writeFileSync,statSync} from 'node:fs';
import {captureTicketEvidence} from '../../../../server/features/handoff/ticket-evidence';
import {readEvidence} from '../../../../server/features/handoff/evidence-artifacts';
import {handoffFixture} from './fixture';
test('captured images have hashed private bytes and explicit unread-image coverage, never invented extraction',async()=>{
 const f=handoffFixture();try{
 const execute=async(_p:string,args:string[])=>JSON.stringify(args[1].includes('?')?[]:{number:1,html_url:'https://github.com/JFusco/brain/issues/1',title:'Screenshot feature',body:'https://github.com/user-attachments/assets/image-id'});
 const extract=vi.fn(async()=>({outcome:'extracted' as const,text:'not an actual image reading'}));
 const {evidence,reference}=await captureTicketEvidence(f.store,'GH-1',execute,async(_url,path)=>writeFileSync(path,Buffer.from([137,80,78,71,13,10,26,10])),extract);
 expect(evidence.attachments[0]).toMatchObject({interpretation:'unread-image',coverage:{state:'complete'}});expect(evidence.attachments[0].sha256).toMatch(/^[a-f0-9]{64}$/);expect(extract).not.toHaveBeenCalled();
 expect(statSync(evidence.attachments[0].artifact!).mode&0o777).toBe(0o600);expect(readEvidence(f.store,'GH-1',reference).summary).toBe('Screenshot feature');
 }finally{f.close();}
});
