import { expect,it } from 'vitest';
import { intakeFixture,authority,event,cleanScan } from './fixture';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { collectionPolicy } from '../../../../server/knowledge/sources/collection-policy';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import type { ReadTask,SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { sourceList } from '../../../../server/knowledge/sources/projection';
const scan=async(text:string)=>({...await cleanScan(text),...(text.includes('SYNTHETIC_WITHHELD')?{clean:false,findings:[{rule:'fixture',line:1,endLine:1}]}:{})});
it.each([false,true])('settles a page while withholding unsafe unit or generated text (generated contamination: %s)',async generatedOnly=>{
 const f=intakeFixture();try{
  const source=f.registry.create({kind:'slack',title:'Project stream',homeProjectId:'brain',authority:{...authority,channels:[{id:'C456',name:'project-stream'}]}}),policy=collectionPolicy(source),ledger=new IntakeLedger(f.store,source);
  const task=newTask(policy,'C456','channel','','0.000000','200.000000','2026-11-06',f.store.clock.now().toISOString());ledger.put('task',task.id,task);ledger.put('identity','C456',{sourceDigest:source.sourceDigest});
  const run=(async(_prompt,_schema,options)=>{options?.onIntakeLaunch?.();options?.onIntakeEvent?.(event(ledger.get<ReadTask>('task',task.id)!,[{ts:'100.000001',text:'Clean project observation'},{ts:'100.000002',text:generatedOnly?'Another clean observation':'SYNTHETIC_WITHHELD'}]));return {units:[{id:'C456:100.000001',outcome:'evidence',reason:generatedOnly?'SYNTHETIC_WITHHELD':'Clean'},{id:'C456:100.000002',outcome:'evidence',reason:generatedOnly?'Clean':'SYNTHETIC_WITHHELD'}]};}) as KnowledgeRunner;
  await runIntakeTask(f.store,run,task.id,f.registry,source.id,scan);
  expect(ledger.get<ReadTask>('task',task.id)).toMatchObject({status:'complete',failures:0});
  const evidence=ledger.all<{text:string;contentSha256:string}>('evidence');expect(evidence).toHaveLength(generatedOnly?2:1);expect(evidence.every(row=>row.contentSha256===digest(row.text)&&!row.text.includes('SYNTHETIC_WITHHELD'))).toBe(true);
  const bad=ledger.all<SourceUnit>('unit').find(unit=>unit.id==='C456:100.000002')!;
  if(!generatedOnly){expect(ledger.get('admission',`${bad.id}:${bad.version}`)).toMatchObject({state:'blocked'});expect(bad).toMatchObject({state:'inaccessible',reason:'secret-scan-blocked'});}else{expect(ledger.all('classification-admission')).toEqual([expect.objectContaining({state:'blocked'})]);expect(ledger.all<SourceUnit>('unit').every(unit=>unit.state==='deferred')).toBe(true);}
  expect(ledger.all('proposal')).toEqual([]);expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
  const summary=sourceList(f.registry,new Map([['brain',f.store]]),'brain').sources.find(row=>row.id===source.id)!;
  expect(summary.gaps.join(' ')).toContain(generatedOnly?'generated classifications withheld':'source versions withheld');expect(JSON.stringify(summary)).not.toContain('SYNTHETIC_WITHHELD');
 }finally{f.close();}
});
