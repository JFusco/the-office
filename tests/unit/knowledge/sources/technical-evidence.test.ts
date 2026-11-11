import { expect,it } from 'vitest';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { intakeFixture,cleanScan,event,authority } from '../slack-intake/fixture';
import { knowledgeStore } from '../knowledge-fixture';
import { runIntakeTask } from '../../../../server/knowledge/slack-intake/run';
import { IntakeLedger } from '../../../../server/knowledge/slack-intake/ledger';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { collectionPolicy } from '../../../../server/knowledge/sources/collection-policy';
import { evidencePage } from '../../../../server/knowledge/sources/evidence-page';
import { retrieve,officeSearch } from '../../../../server/knowledge/retrieval';
import { taskBriefing } from '../../../../server/knowledge/task-briefing';
import { queueWeeklyDigest } from '../../../../server/knowledge/weekly-digest';
import { deliveryMetrics } from '../../../../server/knowledge/delivery-metrics';
import { AssignmentLookups } from '../../../../server/knowledge/lookup/assignments';
import { retainDigestBody,digestKnowledge } from '../../../../server/knowledge/digests/private-body';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import type { ReadTask,SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import type { KnowledgeContext } from '../../../../server/knowledge/context';

it('keeps technical acquisition private until publication while project evidence follows the ordinary delivery route',async()=>{
 const f=intakeFixture(),subscriber=knowledgeStore('cec','2026-11-06T23:00:00Z');try{
  f.registry.subscribe(f.source.id,'cec',true);
  await runIntakeTask(f.store,(async(_prompt,_schema,options)=>{
   options?.onIntakeLaunch?.();options?.onIntakeEvent?.(event(f.ledger.get<ReadTask>('task',f.task.id)!,[{ts:'100.000001',text:'PRIVATE_NATIVE SQLite technical observation'}]));
   const unit=f.ledger.all<SourceUnit>('unit')[0];return {units:[{id:unit.id,outcome:'proposed',reason:''}],proposals:[{domain:'tooling',body:`PRIVATE_CANDIDATE SQLite analysis ${unit.url}`,units:[unit.id]}]};
  }) as KnowledgeRunner,f.task.id,f.registry,f.source.id,cleanScan);
  const project=f.registry.create({kind:'slack',title:'Project SQLite',homeProjectId:'brain',destination:'project-evidence',authority:{...authority,channels:[{id:'C456',name:'project-evidence'}]}}),ledger=new IntakeLedger(f.store,project),policy=collectionPolicy(project),now=f.store.clock.now();
  f.registry.subscribe(project.id,'cec',true);const task=newTask(policy,'C456','channel','','0.000000','200.000000','2026-11-06',now.toISOString());ledger.put('task',task.id,task);ledger.put('identity','C456',{sourceDigest:project.sourceDigest});
  await runIntakeTask(f.store,(async(_prompt,_schema,options)=>{options?.onIntakeLaunch?.();options?.onIntakeEvent?.(event(ledger.get<ReadTask>('task',task.id)!,[{ts:'100.000001',text:'Project SQLite observation'}]));return {units:[{id:'C456:100.000001',outcome:'evidence',reason:'Project evidence'}]};}) as KnowledgeRunner,task.id,f.registry,project.id,cleanScan);
  const context:KnowledgeContext={registry:f.registry,stores:new Map([['brain',f.store],['cec',subscriber.store]]),brain:{snapshot:async()=>{throw Error('No published snapshot');},search:async()=>[],read:async()=>{throw Error('No published note');}}};
  const search=await retrieve(context,'cec','SQLite'),briefing=await taskBriefing(context,'cec','review','SQLite');expect(search.office).toHaveLength(1);expect(search.office[0].excerpt).toBe('Project SQLite observation');expect(search.technical).toEqual([]);expect(officeSearch(context,'brain','PRIVATE_NATIVE')).toEqual([]);expect(briefing.text).toContain('Project SQLite observation');
  const privateRecord=f.ledger.all<{id:string;unitId:string;version:string;contentSha256:string}>('evidence')[0];expect(evidencePage(context,'brain',privateRecord.id)?.text).toContain('PRIVATE_NATIVE');expect(evidencePage(context,'cec',privateRecord.id)).toBeUndefined();
  subscriber.store.state.knowledge!.enabled=true;subscriber.store.state.knowledge!.rollups=[{id:'rollup',weekEnding:'2026-11-06',at:now.toISOString(),metrics:deliveryMetrics(subscriber.store,new Date(now.getTime()-7*86400000),now),summary:'Accepted review',officeProposalIds:[]}];const review=queueWeeklyDigest(context,'cec')!;expect(review.text).toContain('Project SQLite observation');
  const {text:reviewText,...metadata}=review;void reviewText;const retained={...metadata,id:'legacy-technical-review',sha256:digest('PRIVATE_NATIVE prior frozen review'),sourceBindings:[],evidence:[{id:privateRecord.id,kind:'source' as const,sourceId:f.source.id,unitId:privateRecord.unitId,version:privateRecord.version,contentSha256:privateRecord.contentSha256}]};retainDigestBody(subscriber.store,retained,'PRIVATE_NATIVE prior frozen review');subscriber.store.state.knowledge!.digests!.push(retained);expect(digestKnowledge(context,'cec',retained.id)).toBeUndefined();
  const service=new AssignmentLookups(),id=crypto.randomUUID(),dir=resolve(subscriber.store.dataRoot,'sessions',id);mkdirSync(dir,{recursive:true});subscriber.store.state.workLog!.push({id,status:'running'} as never);const cap=service.issue({id,context,store:subscriber.store,dir,stage:'review',snapshot:null,active:()=>true});
  const token=/X-Office-Knowledge: ([\w-]+)/.exec(cap.instructions)![1],url=new URL(`http://localhost/api/knowledge/lookup?assignment=${id}&q=SQLite`),response=await service.route(new Request(url,{headers:{'X-Office-Knowledge':token}}),url),lookup=await response.json();cap.close();expect(lookup.text).toContain('Project SQLite observation');
  expect(JSON.stringify({search,briefing,review,lookup})).not.toContain('PRIVATE_NATIVE');expect(JSON.stringify({search,briefing,review,lookup})).not.toContain('PRIVATE_CANDIDATE');expect(f.ledger.all('proposal')).toHaveLength(1);
 }finally{subscriber.close();f.close();}
});
