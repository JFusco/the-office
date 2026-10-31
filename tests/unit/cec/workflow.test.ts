import { describe, test, expect, afterEach } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { eligibility, ingest, resultGate, advance, ciMatches, containedFile } from '../../../server/cec/workflow';
import { Store, initialSnapshot } from '../../../server/store/store';
import { correlatedBuild } from '../../../server/cec/azure';
import { CEC } from '../../../server/office/config';
import { safeOrigin, sanitize } from '../../../server/office/security';
import { STAGE_ROLE, type Ticket, type StageResult, type AzurePR, type AzureBuild } from '../../../src/shared';
const sha='a'.repeat(40),merge='b'.repeat(40);
function ticket(p:Partial<Ticket>={}):Ticket{return {key:'CEC-999',summary:'Unit-test fixture',type:'Bug',status:'To Do',statusId:'10000',assignee:CEC.account,subtask:false,boardMember:true,url:`${CEC.site}/browse/CEC-999`,updated:'2026-10-27T12:00:00Z',stage:'mailbox',activity:'waiting',blocker:'',runId:'unit-fixture',attempt:0,commit:sha,branch:'',worktree:'',previewUrl:'',prId:0,results:{},findings:[],evidence:[],pilot:false,observedAt:'2026-10-27T12:00:00Z',...p};}
function result(p:Partial<StageResult>={}):StageResult{return {outcome:'passed',summary:'Synthetic unit evidence; not a live acceptance result',commit:sha,evidence:[],findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:0,qaRunDir:'',paidRuns:0,blocker:'',...p};}
const roots:string[]=[];function temp(){const p=mkdtempSync(resolve(tmpdir(),'office-test-'));roots.push(p);return p;}afterEach(()=>{for(const r of roots.splice(0))rmSync(r,{recursive:true,force:true});});
describe('strict CEC intake',()=>{
  test('accepts exact status identities, not board-column names/categories',()=>{expect(eligibility(ticket())).toBe('');expect(eligibility(ticket({status:'Open',statusId:'1'}))).toBe('');expect(eligibility(ticket({status:'Blocked',statusId:'10107'}))).toContain('exact');expect(eligibility(ticket({status:'To Do',statusId:'1'}))).toContain('exact');});
  test('excludes subtasks, other assignees, missing board membership and other projects',()=>{for(const p of [{subtask:true},{assignee:'someone'},{boardMember:false},{key:'OTHER-9'}])expect(eligibility(ticket(p))).not.toBe('');});
  test('does not duplicate tickets or lose PM-managed active work',()=>{const s=initialSnapshot();ingest(s,[ticket(),ticket()]);expect(s.tickets).toHaveLength(1);s.tickets[0].stage='qa';s.tickets[0].status='QA';ingest(s,[]);expect(s.tickets[0].stage).toBe('qa');expect(s.tickets[0].status).toBe('QA');});
  test('an epic is held and a ticket leaving intake is not silently started',()=>{const s=initialSnapshot();ingest(s,[ticket({type:'Epic',status:'Open',statusId:'1'})]);expect(s.tickets[0].blocker).toContain('decomposition');ingest(s,[]);expect(s.tickets[0].activity).toBe('blocked');});
});
describe('proof gates',()=>{
  test('uncertain writes and concurrent edit conflicts never advance',()=>{expect(resultGate(ticket(),'enhance',result({receipts:[{id:'x',action:'jira-update',target:'CEC-999',verified:false,uncertain:true,detail:'Concurrent description update'}]}),temp())).toContain('reconciliation');});
  test('Jira enhancement needs a verified read-back receipt',()=>{expect(resultGate(ticket(),'enhance',result(),temp())).toContain('read-back');});
  test('review and tests must be saved and match candidate HEAD',()=>{const root=temp(),path=resolve(root,'checks.txt');writeFileSync(path,'Synthetic tests');const evidence={id:'check',kind:'checks' as const,path,summary:'Synthetic unit check',commit:sha,url:'',observedAt:'',environment:'unit'};expect(resultGate(ticket(),'implement',result({evidence:[evidence]}),root)).toBe('');expect(resultGate(ticket(),'repair',result({evidence:[{...evidence,commit:merge}]}),root)).toContain('check evidence');expect(resultGate(ticket(),'code-review',result({commit:merge}),root)).toContain('current candidate');});
  test('local checks cannot substitute for browser/harness evidence',()=>{expect(resultGate(ticket(),'qa',result(),temp())).toContain('browser');});
  test('blocked and paid tests preserve uncertainty instead of passing',()=>{expect(resultGate(ticket(),'qa',result({outcome:'blocked',paidRuns:1,blocker:'Provider run failed after billing; preserve the result'}),temp())).toContain('Provider run failed');});
  test('requires harness artifacts, clean verdict, screenshot and ticket update',()=>{
    const root=temp(),qa=resolve(root,'qa');mkdirSync(qa);const png=resolve(qa,'case.png');writeFileSync(png,'synthetic unit fixture, not browser evidence');
    const browser={id:'b',kind:'browser' as const,path:'',summary:'Synthetic unit fixture',commit:sha,url:'http://127.0.0.1:4567',observedAt:'',environment:'unit'};
    const r=result({qaRunDir:qa,evidence:[browser,{...browser,id:'s',kind:'screenshot',path:png}],receipts:[{id:'r',action:'jira-comment',target:'CEC-999',verified:true,uncertain:false,detail:'Synthetic fixture'}]});
    expect(resultGate(ticket(),'qa',r,root)).toContain('report.json');writeFileSync(resolve(qa,'final.md'),'Coverage\nTicket delivery\nSynthetic unit fixture');writeFileSync(resolve(qa,'report.json'),JSON.stringify({product_verdict:'fail',completion_status:'complete',result_handoff:{coverage:{tested:1,failed:1,blocked:0}}}));expect(resultGate(ticket(),'qa',r,root)).toContain('failing');
    writeFileSync(resolve(qa,'report.json'),JSON.stringify({product_verdict:'pass',completion_status:'complete',result_handoff:{coverage:{tested:1,failed:0,blocked:0}}}));expect(resultGate(ticket(),'qa',r,root)).toBe('');
  });
  test('PR publication is a separate stage from CI and Jira readiness',()=>{const t=ticket({stage:'retest'});advance(t,'retest',result({paidRuns:1}));expect(t.stage).toBe('publish');expect(resultGate(t,'publish',result(),temp())).toContain('read-back');advance(t,'publish',result());expect(t.stage).toBe('ci');});
  test('fixer and verifier are different roles',()=>{expect(STAGE_ROLE.repair).toBe('developer');expect(STAGE_ROLE.retest).toBe('qa');expect(STAGE_ROLE['repair-review']).toBe('lead');});
});
describe('durability and ownership',()=>{
  test('one pipeline owner, including across database connections',()=>{const p=resolve(temp(),'office.sqlite'),a=new Store(p),b=new Store(p);expect(a.claim('one',100)).toBe(true);expect(b.claim('two',101)).toBe(false);a.release('one');expect(b.claim('two',102)).toBe(true);a.close();b.close();});
  test('restart retains failed work and does not replay external actions',()=>{const p=resolve(temp(),'office.sqlite');let s=new Store(p);s.state.tickets=[ticket({activity:'working',stage:'draft-pr'})];s.state.agents[0].activity='working';s.save();s.close();s=new Store(p);s.recover();expect(s.ticket('CEC-999').stage).toBe('draft-pr');expect(s.ticket('CEC-999').activity).toBe('blocked');expect(s.ticket('CEC-999').blocker).toContain('Reconcile');expect(s.state.agents[0].activity).toBe('disconnected');s.close();});
  test('event cursor resumes only new observations',()=>{const s=new Store(':memory:');const a=s.emit('test','one');s.emit('test','two');expect(s.replay(a.id).map(e=>e.message)).toEqual(['two']);s.close();});
});
describe('Azure acceptance correlation',()=>{
  const pr:AzurePR={id:3,title:'Synthetic test',draft:false,status:'active',source:'refs/heads/test',target:'refs/heads/staging',commit:sha,mergeCommit:merge,url:'',policies:[{name:'Build',status:'approved',buildId:9}]};
  const build:AzureBuild={id:9,name:'shell-ci',status:'completed',result:'succeeded',commit:merge,branch:'refs/pull/3/merge',url:'',stages:[]};
  test('uses exact current PR merge candidate and policy build identity',()=>{expect(correlatedBuild(pr,[build])?.id).toBe(9);expect(correlatedBuild({...pr,mergeCommit:sha},[build])).toBeUndefined();expect(correlatedBuild(pr,[{...build,id:8}])).toBeUndefined();expect(ciMatches(sha,merge,build,9,9)).toBe(true);});
  test('CI failure, stale commit and missing policies never clear acceptance',()=>{expect(correlatedBuild(pr,[{...build,result:'failed'}])).toBeUndefined();expect(correlatedBuild({...pr,policies:[]},[build])).toBeUndefined();expect(correlatedBuild({...pr,policies:[{...pr.policies[0],status:'running'}]},[build])).toBeUndefined();});
});
describe('local boundaries',()=>{
  test('rejects cross-origin commands',()=>{expect(safeOrigin(new Request('http://127.0.0.1:4318/api/commands',{headers:{origin:'https://evil.example'}}))).toBe(false);expect(safeOrigin(new Request('http://127.0.0.1:4318/api/commands',{headers:{origin:'http://127.0.0.1:4318'}}))).toBe(true);});
  test('redacts credentials and does not expose arbitrary files',()=>{expect(sanitize('Bearer secret-token postgres://user:password@host/db')).not.toContain('password');const root=temp();expect(containedFile('/etc/passwd',root)).toBe(false);});
});
