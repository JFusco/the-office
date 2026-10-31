// Deterministic, synthetic Office state for isolated browser tests and screenshots.
// Nothing here reflects real tickets, people or services; every URL is a fixture.
import type { Agent, AzureBuild, OfficeSnapshot, ProjectGoal, Role, ServiceHealth, Ticket } from '../../../src/shared';

export type FixtureState = {
  projects:{id:string;name:string}[];
  snapshots:Record<string,OfficeSnapshot>;
  health:{checkedAt:string;context:string;services:ServiceHealth[]};
};

const iso=(now:number,minutesAgo=0)=>new Date(now-minutesAgo*60000).toISOString();
const agents=(now:number):Agent[]=>([['pm','Morgan','Project manager'],['developer','Alex','Developer'],['lead','Sam','Lead developer'],['qa','Riley','QA engineer'],['cto','Avery','Technology & priorities']] as [Role,string,string][])
  .map(([id,name,title])=>({id,name,title,activity:'idle',task:'Ready for the next handoff',ticket:'',sessionId:id==='qa'?'fixture-session-riley':'',lastSeen:iso(now,1),
    ...(id==='developer'?{provider:'claude' as const,model:'claude-opus-5-5',effort:'medium',observedModel:'claude-opus-5-5'}:{}),
    ...(id==='pm'?{lastOutcome:{ticket:'CEC-101',summary:'Fixture outcome: requirements confirmed and handed to development.',status:'completed',at:iso(now,30)}}:{})}));
const ticket=(now:number,over:Partial<Ticket>&Pick<Ticket,'key'|'summary'>):Ticket=>({type:'Bug',status:'To Do',statusId:'',assignee:'Fixture User',subtask:false,boardMember:true,url:`https://example.org/browse/${over.key}`,updated:iso(now,20),
  stage:'mailbox',activity:'idle',blocker:'',runId:'',attempt:0,commit:'',branch:'',worktree:'',previewUrl:'',prId:0,results:{},findings:[],evidence:[],pilot:false,observedAt:iso(now,5),...over});
const build=(now:number,id:number,result:string,status='completed'):AzureBuild=>({id,name:`Fixture pipeline ${id}`,status,result,commit:'f1x7ure'.padEnd(40,'0'),branch:'refs/heads/fixture/branch',url:`https://example.org/build/${id}`,
  durationMs:240000,queueMs:30000,observedAt:iso(now,3),linkedTickets:['CEC-102'],relatedPrIds:[42],stages:[{id:`stage-${id}`,type:'Job',attempt:1,name:'Fixture build job',state:'completed',result:result||'inProgress',issues:result==='failed'?['Fixture failure: unit test step exited 1']:[],durationMs:180000}]});

function cec(now:number):OfficeSnapshot{
  return {revision:1,serverTime:iso(now),startedAt:iso(now,600),paused:false,pilotKey:'',mode:'live',
    project:{id:'cec',name:'CEC',provider:'azure',repo:'fixture-repo',repository:'fixture/cec',target:'staging',board:{name:'CEC Jira board',url:'https://verndale.atlassian.net/secure/RapidBoard.jspa?rapidView=9121'}},
    projects:[{id:'cec',name:'CEC',provider:'azure',paused:false,working:0,queued:1,needsYou:1},{id:'brain',name:'Brain',provider:'github',paused:false,working:0,queued:0,needsYou:0},{id:'cms-field-vocabulary',name:'CMS field vocabulary',provider:'github',paused:false,working:0,queued:0,needsYou:0}],
    intake:{status:'idle',lastChecked:iso(now,12),error:'',schedule:'Checks every 15 minutes during working hours'},
    agents:agents(now),
    tickets:[
      ticket(now,{key:'CEC-101',summary:'Fixture: tidy the account settings copy',stage:'mailbox'}),
      ticket(now,{key:'CEC-102',summary:'Fixture: keyboard focus is lost after saving a form',status:'In Progress',stage:'qa',activity:'waiting',commit:'c0ffee'.padEnd(40,'1'),branch:'fixture/cec-102',prId:42,attempt:1,
        results:{understand:{outcome:'passed',summary:'Requirements confirmed.',commit:'',evidence:[],findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:0,qaRunDir:'',paidRuns:null,blocker:''},implement:{outcome:'passed',summary:'Focus returns to the save button.',commit:'',evidence:[],findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:0,qaRunDir:'',paidRuns:null,blocker:''}},
        skippedStages:{enhance:'Fixture: requirements were already complete.'},
        findings:[{id:'F-1',summary:'Fixture finding: focus ring hidden behind the toast',expected:'Focus remains visible.',actual:'Toast overlapped the focused control.',status:'fixed',attempts:1}],
        evidence:[{id:'E-1',kind:'checks',summary:'Fixture checks passed.',path:'',commit:'c0ffee1111',environment:'fixture',url:'',observedAt:iso(now,40)}]}),
    ],
    events:[{id:3,at:iso(now,4),kind:'stage-passed',role:'qa',ticket:'CEC-102',message:'CEC-102 · Fixture: implementation reviewed and handed to QA.'},{id:2,at:iso(now,25),kind:'stage-started',role:'pm',ticket:'CEC-101',message:'CEC-101 · Fixture: Morgan is reading the ticket.'},{id:1,at:iso(now,60),kind:'office-opened',message:'Fixture office is open.'}],
    outbox:[{id:'ticket:CEC-102:qa',title:'CEC-102 needs a test account',detail:'Fixture: QA needs a lower-environment account to finish verification.',role:'qa',ticket:'CEC-102',url:'https://example.org/browse/CEC-102',status:'open',createdAt:iso(now,15),updatedAt:iso(now,15)}],
    messages:[{id:'fixture-message-1',requestId:'fixture-message-1',from:'human',to:'pm',ticket:'',actionId:'',body:'Fixture: what is the team working on?',status:'answered',createdAt:iso(now,50),sessionId:'fixture-session-pm',recheck:false,error:'',recipients:[],receipts:[]},
      {id:'fixture-message-2',requestId:'fixture-message-1',from:'pm',to:'pm',ticket:'',actionId:'',body:'Fixture reply: CEC-102 is with QA and CEC-101 is waiting in the mailbox.',status:'answered',createdAt:iso(now,49),sessionId:'fixture-session-pm',recheck:false,error:'',recipients:['qa'],receipts:[{id:'r1',action:'jira-read',target:'CEC-102',verified:true,uncertain:false,detail:'Fixture read-back confirmed.'}]}],
    projectNotes:[{id:'note-1',ticket:'',summary:'Fixture project note',detail:'Synthetic note for the browser fixture.',requestId:'fixture',createdAt:iso(now,90)}],
    azure:{status:'idle',observedAt:iso(now,3),error:'',builds:[build(now,9001,'succeeded'),build(now,9002,'failed'),build(now,9003,'','inProgress')],
      prs:[{id:42,title:'Fixture: restore focus after save',draft:false,status:'active',source:'refs/heads/fixture/cec-102',target:'refs/heads/main',commit:'',mergeCommit:'',url:'https://example.org/pr/42',policies:[{name:'Build',status:'approved',buildId:9001},{name:'Reviewers',status:'rejected',buildId:0},{name:'Work items',status:'queued',buildId:0}]}],
      deployed:[{environment:'staging',image:'fixture/cec:1.2.3',revision:'fixture-revision-12',url:'https://example.org/staging'}]},
    lastHandoff:null,
    coordination:{enabled:true,activatedAt:iso(now,1000),lastTickAt:iso(now,1),nextDueAt:iso(now,-60),checkpoints:[{id:'cp-1',date:'2026-10-28',dueAt:iso(now,120),requestedAt:iso(now,120),startedAt:iso(now,119),endedAt:iso(now,110),status:'completed',runId:'',detail:'Fixture checkpoint completed.'}],
      pickup:{enabled:true,status:'To Do'},jobs:[],
      listener:{lastCheckedAt:iso(now,1),nextCheckAt:iso(now,-1),error:'',assigned:[{key:'CEC-101',summary:'Fixture: tidy the account settings copy',url:'https://example.org/browse/CEC-101',assignee:'Fixture User',status:'To Do',statusId:'',updated:iso(now,20),type:'Bug',subtask:false}],reviews:[]},
      notices:{policy:{enabled:false,recipients:'both',workspace:'Fixture workspace',mappings:'',enabledAt:''},entries:[]},time:{enabled:true,githubField:false,activatedAt:iso(now,1000),entries:[]}},
    workLog:[{id:'work-1',role:'developer',task:'Fixture implementation session',ticket:'CEC-102',stage:'implement',requestId:'fixture',sessionId:'fixture-session-alex',provider:'claude',model:'claude-opus-5-5',effort:'medium',status:'completed',startedAt:iso(now,180),lastHeartbeatAt:iso(now,150),endedAt:iso(now,150),elapsedMs:1800000,queuedMs:60000,inputTokens:1200,outputTokens:300,durationUncertain:false,reportedAt:iso(now,149)}],
    ciHistory:[build(now,9001,'succeeded')],
    it:{checkedAt:iso(now,1),nextCheckAt:iso(now,-1),status:'monitoring',reports:[{id:'it-1',at:iso(now,30),status:'monitoring',summary:'Fixture: all checks connected.',actions:['Fixture read check recovered'],followUps:[],notified:[],fingerprint:'f'}],recoveries:{},services:[]},
  };
}
function github(now:number,id:'brain'|'cms-field-vocabulary'):OfficeSnapshot{
  const brain=id==='brain',repository=brain?'JFusco/brain':'JFusco/cms-field-vocabulary',name=brain?'Brain':'CMS field vocabulary',number=brain?8:6;
  const lanes=['Backlog','Ready','In progress','Done'];
  const items=[{n:255,title:'Fixture: refresh approved references',status:'Ready'},{n:256,title:'Fixture: tighten catalog validation',status:'In progress'},{n:257,title:'Fixture: archive the old index',status:'Done'},{n:258,title:'Fixture: draft the next capture',status:'Backlog'}]
    .map(i=>({id:`item-${i.n}`,number:i.n,title:i.title,url:`https://github.com/${repository}/issues/${i.n}`,repository,state:i.status==='Done'?'CLOSED':'OPEN',status:i.status}));
  const base=cec(now);
  return {...base,
    project:{id,name,provider:'github',repo:`fixture-${id}`,repository,target:'main',githubProject:{owner:'JFusco',number,url:`https://github.com/users/JFusco/projects/${number}`}},
    intake:{status:'idle',lastChecked:iso(now,30),error:'',schedule:brain?'Daily maintenance at 5:00 PM Eastern':'Daily follow-up at 3:00 PM Eastern'},
    tickets:items.filter(i=>i.state==='OPEN').map(i=>ticket(now,{key:`GH-${i.number}`,summary:i.title,status:'open',url:i.url,stage:'mailbox'})),
    outbox:[],messages:[],projectNotes:[],events:[{id:1,at:iso(now,10),kind:'office-opened',message:`${name} fixture office is open.`}],
    azure:{status:'idle',observedAt:'',error:'',builds:[],prs:[],deployed:[]},
    github:{status:'idle',observedAt:iso(now,2),error:'',issues:items.map(i=>({number:i.number,key:`GH-${i.number}`,title:i.title,state:i.state.toLowerCase(),url:i.url,updatedAt:iso(now,40)})),
      prs:[{number:301,title:'Fixture: tighten catalog validation',state:'open',draft:false,author:'fixture-bot',head:'abc1234'.padEnd(40,'0'),base:'main',url:`https://github.com/${repository}/pull/301`,mergedAt:'',mergeable:true,reviews:[],linkedIssues:[256],checks:[{name:'fixture-ci',status:'completed',conclusion:'success',url:`https://github.com/${repository}/actions/runs/1`,sha:'abc1234'}]}],
      runs:[{id:1,name:'fixture-ci',status:'completed',conclusion:'success',head:'abc1234'.padEnd(40,'0'),branch:'fixture/branch',event:'pull_request',attempt:1,url:`https://github.com/${repository}/actions/runs/1`,createdAt:iso(now,50),updatedAt:iso(now,45),startedAt:iso(now,50)}],
      board:{title:brain?'Brain':'CMS Field Vocabulary',url:`https://github.com/users/JFusco/projects/${number}`,description:'Fixture project board.',readme:'Fixture README for the board.',observedAt:iso(now,2),error:'',lanes,items}},
    maintenance:{runs:[],lastDaily:'',lastWeekly:'',ledger:''},
    coordination:{...base.coordination!,enabled:!brain,pickup:{enabled:true,status:'Ready'},listener:{...base.coordination!.listener,assigned:[],reviews:[]},jobs:[]},
    workLog:[],ciHistory:[],
  };
}
const goals=(now:number):ProjectGoal[]=>[{id:'goal-1',project:'CEC',title:'Fixture: faster review handoffs',detail:'Synthetic goal for the CTO floor.',priority:1,status:'active',updatedAt:iso(now,300),requestId:'fixture'},{id:'goal-2',project:'Brain',title:'Fixture: weekly capture review',detail:'Synthetic idea.',priority:3,status:'idea',updatedAt:iso(now,400),requestId:'fixture'}];

export function createFixtureState(now=Date.now()):FixtureState{
  const snapshots={cec:cec(now),brain:github(now,'brain'),'cms-field-vocabulary':github(now,'cms-field-vocabulary')};
  for(const s of Object.values(snapshots)){s.ctoGoals=goals(now);s.leadershipReports=[{id:'report-1',requestId:'fixture',summary:'Fixture delivery report: one ticket in QA.',ticket:'CEC-102',createdAt:iso(now,200)}];}
  return {projects:[{id:'cec',name:'CEC'},{id:'brain',name:'Brain'},{id:'cms-field-vocabulary',name:'CMS field vocabulary'}],snapshots,
    health:{checkedAt:iso(now,1),context:'Fixture checks: no real services are contacted.',services:[{id:'github',name:'GitHub',status:'connected',detail:'Fixture account verified.',checkedAt:iso(now,1)},{id:'anthropic',name:'Anthropic · Claude',status:'warning',detail:'Fixture: configured login, no model call made.',checkedAt:iso(now,1),nextStep:'Fixture next step.'},{id:'slack',name:'Slack',status:'unknown',detail:'Fixture: not verified.',checkedAt:iso(now,1)}]}};
}
