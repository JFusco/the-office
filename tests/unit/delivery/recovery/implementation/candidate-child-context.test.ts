import {afterEach,expect,test,vi} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {Store} from '../../../../../server/store/store';
import {Engine} from '../../../../../server/scheduling/engine';
import {GitHubDelivery} from '../../../../../server/delivery/pipeline/github-delivery';
import {adoptCandidate} from '../../../../../server/delivery/recovery/implementation/candidate-adoption';
import {readCandidateChildContext} from '../../../../../server/delivery/recovery/implementation/candidate-child-context';
import {projectById} from '../../../../../server/office/projects';
import {coordination} from '../../../../../server/scheduling/coordination';
import {artifact} from '../../../../../server/store/readback-evidence';
import * as sourceGates from '../../../../../server/delivery/recovery/preparation/preparation-gates';
const roots:string[]=[],stores:Store[]=[];
afterEach(()=>{vi.restoreAllMocks();for(const s of stores.splice(0))s.close();for(const p of roots.splice(0))rmSync(p,{recursive:true,force:true});});
function fixture(){
 const root=mkdtempSync(resolve(tmpdir(),'office-parent-child-context-'));roots.push(root);const repo=resolve(root,'primary'),worktree=resolve(root,'candidate');mkdirSync(repo);mkdirSync(worktree);
 const store=new Store(':memory:',{...projectById('cms-field-vocabulary'),repo},root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const head='25868923c5d69a7c98d807f537a3c757f6822431',parent:any={id:'parent-original',key:'GH-100',status:'blocked',stage:'implement',head:'',worktree:'',branch:'',steps:[{stage:'implement',result:{commit:head,worktree,branch:'owned-parent',summary:'Unaccepted original proposal',receipts:[],findings:[{id:'held-profiles',status:'open'}]}}]};
 const cancelled:any={id:'old-cancelled',key:'GH-100',status:'cancelled',steps:[],detail:'Old unrelated PR remains reconciled'};
 const children=[113,114,115].map((n,i)=>({id:'child-'+n,key:'GH-'+n,status:n===115?'blocked':'watching',stage:n===115?'closeout':'lead-pr',head:String(i+1).repeat(40),branch:'child-'+n,pr:118-i,prUrl:`https://github.com/${store.project.repository}/pull/${118-i}`,steps:[{stage:'review',result:{commit:String(i+1).repeat(40)}},{stage:'validate',result:{commit:String(i+1).repeat(40)}}]}));
 store.state.coordination.jobs=[cancelled,parent,...children]as any;const engine=new Engine(store);engine.maintenance.verifyCandidate=vi.fn(async()=>{});
 const pulls=new Map(children.map(c=>[c.pr,{number:c.pr,html_url:c.prUrl,state:c.key==='GH-115'?'closed':'open',draft:false,merged_at:c.key==='GH-115'?'2026-10-30T12:00:00Z':null,merge_commit_sha:'d'.repeat(40),updated_at:'2026-10-30T11:00:00Z',head:{sha:c.head,ref:c.branch,repo:{full_name:store.project.repository}},base:{sha:'e'.repeat(40),ref:'main',repo:{full_name:store.project.repository}},body:'Closes #'+c.key.slice(3)}]));
 const execute:any=async(program:string,args:string[])=>{
  if(program==='git')return args[0]==='rev-parse'?(args[1]==='--show-toplevel'?worktree:head):args[0]==='status'?'':args[0]==='merge-base'?'a'.repeat(40):args.includes('--name-only')?'wiki/held-source-journal.md':'Same scoped proposal';
  if(program==='gh'&&args[0]==='pr'){const child=children.find(c=>c.pr===Number(args[2]))!;return JSON.stringify({closingIssuesReferences:[{url:`https://github.com/${store.project.repository}/issues/${child.key.slice(3)}`}]});}
  throw Error('Unexpected fixture command');
 };
 const delivery=new GitHubDelivery(store,engine,execute);
 vi.spyOn(delivery,'api').mockImplementation(async path=>{
  const comment=path.match(/^issues\/(\d+)\/comments\?/);if(comment)return [];
  const issue=path.match(/^issues\/(\d+)$/);if(issue)return {number:Number(issue[1]),html_url:`https://github.com/${store.project.repository}/issues/${issue[1]}`,state:'open',title:'Exact scoped parent/child',body:'Held proposals remain unaccepted',labels:[],assignees:[{login:'JFusco'}],updated_at:'2026-10-30T10:00:00Z'};
  const pr=path.match(/^pulls\/(\d+)$/);if(pr)return structuredClone(pulls.get(Number(pr[1])));
  if(path.startsWith('actions/runs?'))return {total_count:1,workflow_runs:[{id:42,name:'Quality',status:'completed',conclusion:'success',head_sha:'d'.repeat(40),head_branch:'main',event:'push',repository:{full_name:store.project.repository},html_url:`https://github.com/${store.project.repository}/actions/runs/42`}]};
  throw Error('Unexpected fixture provider path: '+path);
 });
 vi.spyOn(engine.github,'board').mockResolvedValue({url:store.project.githubProject!.url,error:'',items:[{id:'parent-card',repository:store.project.repository,number:100,status:'In progress'}]}as any);
 const gate=vi.spyOn(sourceGates,'acceptedNativeGate').mockImplementation((_s,j)=>{
  const path=resolve(root,`${j.id}-accepted-native-proof.json`);if(!readable(path))writeFileSync(path,JSON.stringify({head:j.head,reviewWorker:'sam-'+j.id,qaWorker:'riley-'+j.id}));
  return {files:[artifact(store,path)],reviewNativeEvidence:[],reviewWorker:'sam-'+j.id,qaWorker:'riley-'+j.id,proofPath:path};
 });
 const assessment:any={allowed:false,repairable:true,summary:'Correct same saved journal using actual follow-up references, preserve held source proposals',findings:[{id:'held-profiles',status:'open'}],preservedDispositions:11,heldProfiles:['cms12','cms13','saas'],followups:children.map(c=>c.prUrl)};
 const run=vi.spyOn(engine.agents,'run').mockResolvedValue(assessment),ownership={complete:true,fresh:true,ownership:{status:'clear'}},refresh=vi.fn(async()=>ownership);
 return {root,store,parent,cancelled,children,engine,delivery,pulls,run,gate,head,worktree,assessment,ownership,refresh,adopt:()=>adoptCandidate(delivery,'GH-100',ownership,refresh)};
}
function readable(path:string){try{readFileSync(path);return true;}catch{return false;}}
test('actual same-request adoption receives all current child PRs and exact source proof locators without a provider comment',async()=>{
 const a=fixture(),prior=JSON.stringify(a.parent.steps),old=JSON.stringify(a.cancelled);
 const request:any={actionId:'',body:'Read related child facts',receipts:[],createdAt:'2026-10-30T12:00:00Z',id:'human-related-context',requestId:'human-related-context',from:'human',to:'pm',ticket:'GH-100',status:'answered',error:''};
 const answer:any={actionId:'',body:'Read-only verified child facts; no comment sent',createdAt:'2026-10-30T12:01:00Z',id:'pm-advisory-answer',requestId:request.id,from:'pm',ticket:'GH-100',status:'answered',error:'',sessionId:'pm-native',receipts:[{id:'harness-note',verified:true,uncertain:false}]};a.store.state.messages.push(request,answer);
 a.store.state.workLog!.push({id:'pm-advisory-worker',sessionId:'pm-native',requestId:request.id,role:'pm',ticket:'GH-100',stage:'conversation',status:'completed',provider:'codex',endedAt:'2026-10-30T12:00:00Z'}as any);
 const pmRoot=resolve(a.root,'sessions/pm-advisory-worker');mkdirSync(pmRoot,{recursive:true});writeFileSync(resolve(pmRoot,'provider.json'),JSON.stringify({project:a.store.project.id,repository:a.store.project.repository,role:'pm',provider:'codex',readOnly:true}));writeFileSync(resolve(pmRoot,'result.json'),JSON.stringify({session:'pm-native',result:{reply:'Read-only child facts; no comment sent',receipts:[]}}));writeFileSync(resolve(pmRoot,'assignment-identity.json'),JSON.stringify({attemptId:'pm-advisory-worker',requestId:request.id,projectId:a.store.project.id,repository:a.store.project.repository,role:'pm',threadId:'pm-native'}));
 a.run.mockImplementation(async(_role,prompt)=>{expect(prompt).toContain('RELATED CHILD DELIVERY CONTEXT');for(const child of a.children)expect(prompt).toContain(child.prUrl);expect(prompt).toContain('riley-child-113');expect(prompt).toContain('"conclusion":"success"');expect(prompt).toContain('UNACCEPTED');expect(prompt).toContain('pm-advisory-answer');expect(prompt).toContain('not provider success or source acceptance');expect(prompt).toContain('\"available\":true');return a.assessment;});
 await a.adopt();expect(a.run).toHaveBeenCalledTimes(1);expect(a.refresh).toHaveBeenCalledTimes(1);expect(a.gate).toHaveBeenCalledTimes(6);
 expect(a.parent).toMatchObject({id:'parent-original',head:a.head,worktree:a.worktree,branch:'owned-parent',status:'queued',stage:'scope-repair'});expect(JSON.stringify(a.parent.steps)).toBe(prior);expect(JSON.stringify(a.cancelled)).toBe(old);expect(a.parent.steps[0].result.findings[0].status).toBe('open');
});
test.each(['provider-head','human-input','final-human-input','project-mismatch','proof-bytes'])('parent adoption rejects changed exact child/context evidence: %s',async scenario=>{
 const a=fixture(),before=JSON.stringify(a.parent);
 const changeInput=()=>{const id='new-human-input';a.store.state.messages.push({id,requestId:id,from:'human',to:'pm',ticket:'GH-100',status:'answered',error:''}as any,{id:'answer',requestId:id,from:'pm',ticket:'GH-100',status:'answered',error:'',receipts:[]}as any);a.store.state.projectNotes.push({id:'note',ticket:'GH-100',requestId:id,summary:'Changed scope',detail:'Retain all holds',createdAt:'2026-10-30T12:00:00Z'});};
 a.run.mockImplementation(async()=>{if(scenario==='provider-head')a.pulls.get(118)!.head.sha='f'.repeat(40);if(scenario==='human-input')changeInput();if(scenario==='project-mismatch')a.store.project.repository='JFusco/foreign';if(scenario==='proof-bytes')writeFileSync(resolve(a.root,'child-113-accepted-native-proof.json'),'changed');return a.assessment;});
 if(scenario==='final-human-input')a.refresh.mockImplementation(async()=>{changeInput();return a.ownership;});
 await expect(a.adopt()).rejects.toThrow();expect(JSON.stringify(a.parent)).toBe(before);expect(a.run).toHaveBeenCalledTimes(1);
});
test('foreign child repository cannot enter the parent context or start an assessment',async()=>{
 const a=fixture();a.pulls.get(118)!.head.repo.full_name='JFusco/foreign';await expect(a.adopt()).rejects.toThrow('identity');expect(a.run).not.toHaveBeenCalled();expect(a.parent.status).toBe('blocked');
});

test('later published conflict head and failed metadata remain separate from historical source review and QA',async()=>{
 const a=fixture(),child=a.children[1],sourceHead=child.head,publishedHead='f'.repeat(40);child.head=publishedHead;child.stage='prepare-pr';child.status='blocked';(child as any).detail='Original metadata worker failed; effects require reconciliation';a.pulls.get(child.pr)!.head.sha=publishedHead;
 const context=await readCandidateChildContext(a.delivery,a.parent,a.head),fact=context!.children.find(c=>c.ticket==='GH-114')!;
 expect(fact.pr.head).toBe(publishedHead);expect(fact.source).toMatchObject({head:sourceHead,currentPRHead:false});expect(fact.delivery).toEqual({stage:'prepare-pr',status:'blocked',detail:'Original metadata worker failed; effects require reconciliation'});expect(context!.authority).toContain('no source-lock or broader claim acceptance');expect(a.run).not.toHaveBeenCalled();expect(a.parent.status).toBe('blocked');
});
