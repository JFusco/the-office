import {command} from './process';
import {CEC} from './config';
import type {HealthReport,OfficeSnapshot,ServiceHealth} from '../src/shared';

type Probe={id:string;name:string;program:string;args:string[];parse:(raw:string)=>Pick<ServiceHealth,'status'|'detail'|'identity'>;nextStep:string};
const probes:Probe[]=[
 {id:'openai',name:'OpenAI · Codex',program:'codex',args:['login','status'],parse:()=>({status:'connected',detail:'Codex reports a configured login. No model call was made.'}),nextStep:'Run codex login in your terminal, then refresh. Check the Office service account if the terminal already works.'},
 {id:'anthropic',name:'Anthropic · Claude',program:'claude',args:['auth','status','--json'],parse:raw=>{const s=JSON.parse(raw);return {status:s.loggedIn?'connected':'disconnected',detail:s.loggedIn?'Claude reports a configured login. No model call was made.':'Claude reports no active login in the Office environment.',identity:s.loggedIn?s.email:undefined};},nextStep:'Check Claude’s /login in your terminal, then refresh. An already logged-in terminal may differ from the Office service environment.'},
 {id:'github',name:'GitHub',program:'gh',args:['auth','status','--active','--hostname','github.com','--json','hosts'],parse:raw=>{const host=JSON.parse(raw).hosts?.['github.com']?.find((h:any)=>h.active);return {status:host?.state==='success'?'connected':'disconnected',identity:host?.login,detail:host?.state==='success'?'GitHub verified the active account. Repository and Projects permissions can still differ.':'GitHub could not verify its active account.'};},nextStep:'Check gh auth status in your terminal. Confirm repo and project scopes for the intended account.'},
 {id:'atlassian',name:'Atlassian · Jira & Confluence',program:'twg',args:['whoami','-o','json','--output-summary','none'],parse:raw=>{const s=JSON.parse(raw),u=s.data;return {status:!s.error&&s.ok!==false&&!!u?.accountId?'connected':'unknown',detail:!s.error&&s.ok!==false&&u?.accountId?'Atlassian verified the TWG identity. Jira and Confluence permissions remain resource-specific.':'TWG did not return a verified Atlassian identity.',identity:u?.name};},nextStep:'Run twg doctor in your terminal to inspect the active connection and authentication.'},
 {id:'azure',name:'Azure DevOps',program:'az',args:['devops','project','show','--project',CEC.project,'--organization',CEC.organization,'--query','id','--output','json'],parse:raw=>({status:typeof JSON.parse(raw)==='string'?'connected':'unknown',detail:'Read-only access check for the configured CEC Azure DevOps project.'}),nextStep:'Check Azure DevOps access for the Office service account and configured organization.'},
];
export class ServiceHealthChecks {
 private cached?:{at:number;services:ServiceHealth[]};private pending?:Promise<ServiceHealth[]>;
 constructor(private execute:typeof command=command){}
 private async logins(){
  if(this.cached&&Date.now()-this.cached.at<60000)return this.cached.services;
  if(this.pending)return this.pending;
  this.pending=Promise.all(probes.map(async (p):Promise<ServiceHealth>=>{
   const checkedAt=new Date().toISOString();
   try{return {...p.parse(await this.execute(p.program,p.args,{timeout:60000,readOnly:true})),id:p.id,name:p.name,checkedAt,nextStep:p.nextStep};}
   catch(error){const text=String(error),auth=/not logged in|authentication|unauthorized|invalid.*token|expired.*token|login required|no active account|not authenticated|401\b/i.test(text),timeout=/timed? out|timeout/i.test(text);return {id:p.id,name:p.name,status:auth?'disconnected':'unknown',detail:auth?'The Office process could not authenticate.':timeout?'The read-only status check timed out after 60 seconds. Login status is unverified.':'The status command could not complete. Login status is unverified.',checkedAt,nextStep:auth?p.nextStep:'Ellis owns the read-only checks; Morgan investigates persistent probe failures. No login change is indicated by this result.'};}
  })).then(services=>{this.cached={at:Date.now(),services};return services;}).finally(()=>{this.pending=undefined;});
  return this.pending;
 }
 async report(snapshots:OfficeSnapshot[]):Promise<HealthReport>{
  const checkedAt=new Date().toISOString(),services=(await this.logins()).map(s=>({...s}));
  for(const [id,provider] of [['anthropic','claude'],['openai','codex']] as const){
   const failure=snapshots.flatMap(s=>s.workLog||[]).filter(w=>w.provider===provider&&w.status==='failed').sort((a,b)=>b.endedAt.localeCompare(a.endedAt))[0];
   if(!failure)continue;
   const row=services.find(s=>s.id===id)!;row.lastFailure={at:failure.endedAt,detail:`${failure.ticket||'Office'} · ${failure.stage} failed. Read the original session before retrying its work.`};
  }
  services.push({id:'office',name:'Office service',status:'connected',detail:'Local service is responding.',checkedAt});
  for(const s of snapshots){
   const listener=s.coordination?.listener;
   if(listener){const fresh=!!listener.lastCheckedAt&&Date.now()-Date.parse(listener.lastCheckedAt)<150000;services.push({id:`listener:${s.project?.id}`,name:`${s.project?.name||'Project'} · assignment listener`,status:listener.error?'warning':fresh?'connected':'unknown',detail:listener.error?'The latest assignment check failed; saved assignments are retained.':fresh?'A recent assignment check succeeded.':s.paused?'Project paused. Assignment checks wait until resumed.':'No recent completed assignment check.',checkedAt:listener.lastCheckedAt||checkedAt});}
  }
  const delivery=snapshots.flatMap(s=>s.slackDeliveries||[]).filter(d=>d.status==='confirmed').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];
  services.push({id:'slack',name:'Slack · connected app',status:'unknown',detail:delivery?`Last confirmed delivery: ${new Date(delivery.updatedAt).toISOString()}. Current login has not been checked.`:'Managed through the worker’s connected app. Current login has not been checked.',checkedAt,nextStep:'Verify Slack in the worker’s connected apps. A past delivery does not prove current access.'});
  return {checkedAt,context:'Checks run in the Office service environment. Login status, resource access and delivery results are separate. Status checks are cached for 60 seconds; no model calls are made.',services};
 }
}
