import {command} from '../workers/process';
import {PROJECT_BINDINGS} from './projects';
import type {ProjectBindings} from './project-bindings-config';
import type {HealthReport,OfficeSnapshot,ServiceHealth} from '../../src/shared';
import {ProviderStatusChecks} from './provider-status';
import {slackHealth} from './slack-health';
import {listenerHealth} from './listener-health';
import {MAX_SIGN_IN_DIAGNOSTIC_LENGTH,signInFailure} from './sign-in-failure';

type ProbeResult=Pick<ServiceHealth,'status'|'detail'|'identity'|'failure'>;
export type Probe={id:string;name:string;program:string;args:string[];parse:(raw:string,stderr?:string)=>ProbeResult;nextStep:string};
const authFailure=/not logged in|authentication|unauthorized|invalid.*token|expired.*token|login required|no active account|not authenticated|401\b/i;

function githubStatus(raw:string,stderr=''):ProbeResult {
 const hosts: { active: boolean; state: string; login?: string; error?: unknown }[] | undefined=JSON.parse(raw).hosts?.['github.com'];
 const host=hosts?.find(account=>account.active);
 if(host?.state==='success')
  return {status:'connected',identity:host.login,detail:'GitHub verified the active account. Repository and Projects permissions can still differ.'};
 const diagnostic=host ? host.error : authFailure.test(stderr) && stderr;
 const failure=typeof diagnostic==='string' ? signInFailure(diagnostic) : '';
 return {status:'disconnected',identity:host?.login,detail:'GitHub could not verify its active account.',...(failure&&{failure})};
}

const probes:Probe[]=[
 {id:'openai',name:'OpenAI · Codex',program:'codex',args:['login','status'],parse:()=>({status:'connected',detail:'Codex reports a configured login. No model call was made.'}),nextStep:'Run codex login in your terminal, then refresh. Check the Office service account if the terminal already works.'},
 {id:'anthropic',name:'Anthropic · Claude',program:'claude',args:['auth','status','--json'],parse:raw=>{const s=JSON.parse(raw);return {status:s.loggedIn?'connected':'disconnected',detail:s.loggedIn?'Claude reports a configured login. No model call was made.':'Claude reports no active login in the Office environment.',identity:s.loggedIn?s.email:undefined};},nextStep:'Check Claude’s /login in your terminal, then refresh. An already logged-in terminal may differ from the Office service environment.'},
 {id:'github',name:'GitHub',program:'gh',args:['auth','status','--active','--hostname','github.com','--json','hosts'],parse:githubStatus,nextStep:'Check gh auth status in your terminal. Confirm repo and project scopes for the intended account.'},
 {id:'atlassian',name:'Atlassian · Jira & Confluence',program:'twg',args:['whoami','-o','json','--output-summary','none'],parse:raw=>{const s=JSON.parse(raw),u=s.data;return {status:!s.error&&s.ok!==false&&!!u?.accountId?'connected':'unknown',detail:!s.error&&s.ok!==false&&u?.accountId?'Atlassian verified the TWG identity. Jira and Confluence permissions remain resource-specific.':'TWG did not return a verified Atlassian identity.',identity:u?.name};},nextStep:'Run twg doctor in your terminal to inspect the active connection and authentication.'},
];
/** One read-only Azure DevOps check per bound Jira/Azure project; cec keeps the original id and wording. */
export function azureProbes(bindings: ReadonlyMap<string, ProjectBindings>): Probe[] {
 return [...bindings].map(([id, binding]) => ({id:id==='cec'?'azure':`azure:${id}`,name:id==='cec'?'Azure DevOps':`Azure DevOps · ${binding.jira.projectKey}`,program:'az',args:['devops','project','show','--project',binding.azure.project,'--organization',binding.azure.organization,'--query','id','--output','json'],parse:raw=>({status:typeof JSON.parse(raw)==='string'?'connected':'unknown',detail:`Read-only access check for the configured ${binding.jira.projectKey} Azure DevOps project.`}),nextStep:'Check Azure DevOps access for the Office service account and configured organization.'}));
}
probes.push(...azureProbes(PROJECT_BINDINGS));
export class ServiceHealthChecks {
 private cached?:{at:number;services:ServiceHealth[]};private pending?:Promise<ServiceHealth[]>;
 private providers:ProviderStatusChecks;
 constructor(private execute:typeof command=command){this.providers=new ProviderStatusChecks(execute);}
 private async logins(){
  if(this.cached&&Date.now()-this.cached.at<60000)return this.cached.services;
  if(this.pending)return this.pending;
  this.pending=Promise.all(probes.map(async (p):Promise<ServiceHealth>=>{
   const stamp=()=>({kind:'login' as const,checkedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+150000).toISOString()});
   let stderr: string | undefined='';
   try {
    const raw=await this.execute(p.program,p.args,{timeout:60000,readOnly:true,onOutput:(stream,chunk)=>{
     if(stream!=='stderr'||stderr===undefined)return;
     // Discard the whole diagnostic on overflow, since a fragment can lose the credential label.
     stderr=stderr.length+chunk.length<=MAX_SIGN_IN_DIAGNOSTIC_LENGTH ? stderr+chunk : undefined;
    }});
    return {...p.parse(raw,stderr),id:p.id,name:p.name,...stamp(),nextStep:p.nextStep};
   } catch(error) {
    const text=String(error),auth=authFailure.test(text),timeout=/timed? out|timeout/i.test(text);
    // The whole stderr when it was kept. When nothing came on stderr at all, the runner's own message, which carries an
    // error a tool printed on stdout. Stderr that overflowed is quoted from neither: the message would be a fragment.
    const failure=auth ? signInFailure(stderr==='' ? text : stderr) : '';
    return {id:p.id,name:p.name,status:auth?'disconnected':'unknown',detail:auth?'The Office process could not authenticate.':timeout?'The read-only status check timed out after 60 seconds. Login status is unverified.':'The status command could not complete. Login status is unverified.',...(failure&&{failure}),...stamp(),nextStep:auth?p.nextStep:'Ellis owns the read-only checks; Morgan investigates persistent probe failures. No login change is indicated by this result.'};
   }
  })).then(services=>{this.cached={at:Date.now(),services};return services;}).finally(()=>{this.pending=undefined;});
  return this.pending;
 }
 async report(snapshots:OfficeSnapshot[]):Promise<HealthReport>{
  const [logins,providers]=await Promise.all([this.logins(),this.providers.report()]);
  const checkedAt=new Date().toISOString(),services=[...logins,...providers].map(s=>({...s}));
  for(const [id,provider] of [['anthropic','claude'],['openai','codex']] as const){
   const failure=snapshots.flatMap(s=>s.workLog||[]).filter(w=>w.provider===provider&&w.status==='failed').sort((a,b)=>b.endedAt.localeCompare(a.endedAt))[0];
   if(!failure)continue;
   const row=services.find(s=>s.id===id)!;row.lastFailure={at:failure.endedAt,detail:`${failure.ticket||'Office'} · ${failure.stage} failed. Read the original session before retrying its work.`};
  }
  services.push({id:'office',name:'Office service',status:'connected',detail:'Local service is responding.',checkedAt,expiresAt:new Date(Date.parse(checkedAt)+150000).toISOString()});
  for(const s of snapshots){const listener=listenerHealth(s);if(listener)services.push(listener);}
  services.push(slackHealth(snapshots));
  return {checkedAt,context:'Login and public provider checks refresh automatically about once a minute while the Office is running. Each timestamp identifies its own check or confirmed activity. Slack updates from message readbacks; no test messages or model calls are made.',services};
 }
}
