import {vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {coordination} from '../../../../../server/scheduling/coordination';
import {projectById} from '../../../../../server/office/projects';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {ProjectProgress} from '../../../../../server/delivery/board/project-progress';
import {withAssignment} from '../../../../../server/workers/assignment-context';
import {withAmendmentOwnership} from '../../../../../server/delivery/recovery/implementation/delivery-ownership';
import {workerProfile} from '../../../../../server/workers/worker-profiles';
import * as processTools from '../../../../../server/workers/process';
import * as handoffs from '../../../../../server/delivery/recovery/implementation/saved-prerequisite-handoff';
import {digest} from '../../../../../server/store/readback-evidence';
import {enqueueRequest} from '../../../../../server/scheduling/requests';
import type {StageResult} from '../../../../../src/shared';
const fixtures:{root:string;store:Store}[]=[];
/** Restores spies, closes every store a fixture opened and removes its folder. Register with afterEach in each suite that uses fixture(). */
export function cleanupFixtures(){vi.restoreAllMocks();for(const f of fixtures.splice(0)){f.store.close();rmSync(f.root,{recursive:true,force:true});}}
export const oldHead='2'.repeat(40),head='9'.repeat(40);
/**
 * A completed Claude writer whose saved passed result declares a PR prerequisite, with every artifact the handoff reads.
 * `harnessWorktree` gives an `implement` job the worktree and branch the harness created before the writer ran, with no head.
 */
export function fixture(stage:'implement'|'scope-repair'='scope-repair',projectId='cms-field-vocabulary',{harnessWorktree=false}:{harnessWorktree?:boolean}={}){
 const root=mkdtempSync(resolve(tmpdir(),'office-saved-prereq-')),repo=resolve(root,'repo'),candidate=resolve(root,'candidate'),data=resolve(root,'office'),nativeRoot=resolve(root,'native');
 const preset=stage==='scope-repair'||harnessWorktree,cwd=preset?candidate:repo;
 for(const p of [repo,candidate,nativeRoot])mkdirSync(p,{recursive:true});writeFileSync(resolve(candidate,'.git'),'gitdir: '+resolve(repo,'.git/worktrees/candidate')+'\n');
 const store=new Store(':memory:',{...projectById(projectId),repo},data);fixtures.push({root,store});store.state.coordination=coordination();store.state.coordination.enabled=true;
 const engine=new Engine(store);const owned=vi.fn(async()=>({complete:true,fresh:true,ownership:{status:'clear'}}));
 const issue={number:100,html_url:`https://github.com/${store.project.repository}/issues/100`,state:'open',updated_at:'2026-10-31T01:00:00Z',title:'Review proposed source changes',body:'Eight source baselines require human acceptance. Child PR closure remains required.',labels:[],assignees:[{id:1,login:'JFusco'}]};
 const child:any={number:117,html_url:`https://github.com/${store.project.repository}/pull/117`,state:'open',merged:false,merge_commit_sha:null,updated_at:'2026-10-31T01:00:00Z',head:{sha:'7'.repeat(40)},base:{ref:'main',repo:{full_name:store.project.repository}}};
 const reads:string[]=[];const execute=vi.fn(async(_bin:string,args:string[])=>{
  reads.push(args.join(' '));if(args[0]==='api'){
   const p=args[1].replace('repos/'+store.project.repository+'/','');if(p==='issues/100')return JSON.stringify(issue);if(p.startsWith('issues/100/comments'))return '[]';if(p==='pulls/117')return JSON.stringify(child);if(p.startsWith('pulls?'))return '[]';throw new Error('Unexpected API '+p);
  }
  if(args[0]==='rev-parse')return args[1]==='--show-toplevel'?candidate:head;
  if(args[0]==='status'||args[0]==='ls-remote')return '';
  if(args[0]==='merge-base')return args[1]==='--is-ancestor'?'':oldHead;
  if(args[0]==='diff')return args[1]==='--name-only'?'wiki/journal/fixture.md':'wiki/journal/fixture.md | 1 +';
  if(args[0]==='branch')return 'codex/fixture-100';if(args[0]==='remote')return 'https://github.com/'+store.project.repository;
  throw new Error('Unexpected command '+args.join(' '));
 });
 vi.spyOn(processTools,'processGroupAlive').mockReturnValue(false);vi.spyOn(ProjectProgress.prototype,'reconcile').mockResolvedValue(undefined);
 vi.spyOn(engine.github,'board').mockResolvedValue({url:store.project.githubProject!.url,error:'',items:[{id:'card-100',number:100,repository:store.project.repository,status:'In progress'}]}as any);
 const delivery=new GitHubDelivery(store,engine,execute as any);delivery.enqueue('GH-100');const job=delivery.jobs[0];
 Object.assign(job,{stage,status:'working',head:stage==='implement'?'':oldHead,worktree:preset?candidate:'',branch:preset?'codex/fixture-100':'',candidateRecovery:stage==='implement'?undefined:{head:oldHead,findingIds:['child-source'],summary:'Original child finding remains OPEN'},approach:{plan:'brief',review:'none',validation:'developer-checks',checks:['focused checks'],reason:'Prior route'}});
 const proofRoot=resolve(data,'ticket-work',job.id);mkdirSync(proofRoot,{recursive:true});const check=resolve(proofRoot,'checks.log');writeFileSync(check,'Synthetic current-head checks passed');
 const result:StageResult={outcome:'passed',summary:'Journal-only repair; child source remains unmerged',commit:head,approach:null,resolution:null,prerequisites:[{target:{projectId:store.project.id,kind:'pr',id:'117'},condition:'pr-merged',evidence:'Explicit structured dependency, never finding authority',observedAt:'2026-10-31T01:00:00Z'}],findings:[{id:'child-source',summary:'Original child source finding',expected:'Independent acceptance',actual:'Child PR still open',status:'open',attempts:1}],evidence:[{id:'checks',kind:'checks',path:check,commit:head,summary:'Current-head checks',environment:'local',url:'',observedAt:''}],receipts:[],worktree:candidate,branch:'codex/fixture-100',prId:0,paidRuns:0,qaRunDir:'',previewUrl:'',blocker:''};
 const claim=store.claimWork({projectId:store.project.id,kind:'delivery',id:job.id},'fixture',stage)!;
 const original={id:'original-writer',sessionId:'original-writer',requestId:job.id,ticket:job.key,role:'developer',provider:'claude',stage:`github-${stage}`,status:'completed',executionStatus:'completed',lane:'delivery',claimId:claim.id,startedAt:'2026-10-31T01:00:00Z',endedAt:'2026-10-31T01:01:00Z',processId:2147483400}as any;
 const dir=resolve(data,'sessions',original.id);mkdirSync(dir,{recursive:true});const put=(name:string,value:unknown)=>writeFileSync(resolve(dir,name),JSON.stringify(value));
 const saveWriter=()=>{
  if(!store.state.workLog?.some(w=>w.id===original.id))(store.state.workLog??=[]).push(original);
  const profile=workerProfile(original.stage,false);put('provider.json',{project:store.project.id,repository:store.project.repository,role:'developer',provider:'claude',session:original.sessionId,readOnly:false});
  put('assignment.json',{id:original.id,claimId:claim.id,lane:'delivery',stage:original.stage,role:'developer',work:claim.work,scope:{repository:store.project.repository,worktree:cwd,artifacts:dir},profile:profile.name});
  put('assignment-identity.json',{attemptId:original.id,requestId:job.id,projectId:store.project.id,repository:store.project.repository,threadId:original.sessionId,role:'developer'});put('capabilities.json',profile);put('result.json',{provider:'claude',session:original.sessionId,result});
  put('execution-completion.json',{workerId:original.id,session:original.sessionId,provider:'claude',resultSha256:digest({provider:'claude',session:original.sessionId,result})});
  put('provider-completion.json',{expectedSession:original.sessionId,result:{type:'result',subtype:'success',terminal_reason:'completed',is_error:false,session_id:original.sessionId,structured_output:result}});
  const nativeDir=resolve(nativeRoot,cwd.replace(/[^a-zA-Z0-9-]/g,'-'));mkdirSync(nativeDir,{recursive:true});writeFileSync(resolve(nativeDir,original.id+'.jsonl'),JSON.stringify({sessionId:original.sessionId,cwd,message:{content:[{type:'tool_use',id:'inspect',name:'Read',input:{file_path:check}},{type:'tool_result',tool_use_id:'inspect',content:'Synthetic inspected checks'},{type:'tool_use',id:'structured',name:'StructuredOutput',input:result},{type:'tool_result',tool_use_id:'structured',content:'Synthetic output accepted'}]}})+'\n');
 };
 const nativePath=resolve(nativeRoot,cwd.replace(/[^a-zA-Z0-9-]/g,'-'),original.id+'.jsonl');
 const realHandoff=handoffs.handoffSavedPrerequisites;vi.spyOn(handoffs,'handoffSavedPrerequisites').mockImplementation((d,j,w,o,i)=>realHandoff(d,j,w,o,i,nativeRoot));
 const run=vi.spyOn(engine.agents,'run').mockImplementation(async()=>{saveWriter();return structuredClone(result) as any;});
 const normal=()=>withAmendmentOwnership(owned,()=>withAssignment(claim,'delivery',()=>delivery.step(job)));
 const prepareRecovery=()=>{saveWriter();job.steps.push({stage,result:structuredClone(result)});job.status='blocked';store.finishClaim(claim.id,'completed');const request=enqueueRequest(store,'reconcile-implementation',job.key,original.id);const reader=store.claimWork({projectId:store.project.id,kind:'reconciliation',id:request.id},'fixture-reader','reconcile-implementation')!;request.status='working';return{request,reader,perform:()=>withAssignment(reader,'delivery',()=>handoffs.handoffSavedPrerequisites(delivery,job,original.id,owned,request.id))};};
 return {root,store,engine,delivery,job,claim,original,result,put,saveWriter,owned,execute,child,issue,run,normal,prepareRecovery,nativeRoot,nativePath,reads};
}
