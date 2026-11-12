import { test,expect } from 'vitest';
import { mkdirSync,readFileSync,writeFileSync,symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { knowledgeStore } from './knowledge-fixture';
import { prepareExposure,dispatchExposure } from '../../../server/knowledge/lesson-exposure';
import { assignmentKnowledge } from '../../../server/knowledge/assignment-view';
import { taskBriefing } from '../../../server/knowledge/task-briefing';
import { digest } from '../../../server/knowledge/digest';
import { lookupJournal } from '../../../server/knowledge/lookup/receipts';
async function fixture(){
    const f=knowledgeStore('brain','2026-11-06T23:00:00Z'),id=randomUUID(),dir=resolve(f.store.dataRoot,'sessions',id);mkdirSync(dir,{recursive:true});
    f.store.state.knowledge!.enabled=true;const text='Schema receipts version one',note={id:'schema',path:'knowledge/schema.md',title:'Schema',contentSha256:digest(text)};
    const context={stores:new Map([['brain',f.store]]),brain:{snapshot:async()=>'a'.repeat(40),search:async()=>[note],read:async()=>({text,contentSha256:note.contentSha256})}},evidence=await taskBriefing(context,'brain','implement','Schema');
    prepareExposure(f.store,dir,id,'implement',{text:'',selected:[],eligible:[],omitted:[]},undefined,evidence);dispatchExposure(f.store,id);
    const journal=lookupJournal(f.store,dir,id,'implement');journal.append('schema',{assignment:id,index:1,at:'now',outcome:'served',...evidence,textSha256:digest(evidence.text)});journal.finish();
    return {...f,id,dir,context,text};
}
test('serves exact immutable supplied bytes and one lookup per detail chunk',async()=>{const f=await fixture();try{const before=readFileSync(resolve(f.dir,'lessons.json'),'utf8'),result=assignmentKnowledge(f.context,'brain',f.id)!;expect(result.supplied.sourceEvidenceText).toContain(f.text);expect(result.lookups).toEqual([{index:1,at:'now',outcome:'served'}]);expect(result.lookup).toBeUndefined();expect(assignmentKnowledge(f.context,'brain',f.id,1)!.lookup!.response.text).toContain(f.text);expect(assignmentKnowledge(f.context,'brain',f.id,2)).toBeUndefined();expect(readFileSync(resolve(f.dir,'lessons.json'),'utf8')).toBe(before);expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThanOrEqual(65536);}finally{f.close();}});
test('retained assignment knowledge cannot cross projects',async()=>{const f=await fixture();try{expect(assignmentKnowledge(f.context,'cec',f.id)).toBeUndefined();expect(readFileSync(resolve(f.dir,'lessons.json'),'utf8')).toContain(f.text);}finally{f.close();}});
test('rejects tampered supply and unregistered attempts while keeping verified supply separate from unavailable logs',async()=>{const f=await fixture();try{expect(assignmentKnowledge(f.context,'brain','../secrets')).toBeUndefined();const path=resolve(f.dir,'lessons.json'),original=readFileSync(path,'utf8'),changed=JSON.parse(original);changed.sourceEvidenceText='A different private record';writeFileSync(path,JSON.stringify(changed));expect(assignmentKnowledge(f.context,'brain',f.id)).toBeUndefined();writeFileSync(path,original);const {unlinkSync}=await import('node:fs');unlinkSync(resolve(f.dir,'lookups.jsonl'));symlinkSync(path,resolve(f.dir,'lookups.jsonl'));const preserved=assignmentKnowledge(f.context,'brain',f.id,1)!;expect(preserved.lookupRecordingUnavailable).toBe(true);expect(preserved.lookup).toBeUndefined();expect(preserved.supplied.sourceEvidenceText).toContain(f.text);expect(readFileSync(path,'utf8')).toBe(original);}finally{f.close();}});
