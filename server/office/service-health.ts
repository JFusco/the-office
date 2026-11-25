import {command} from '../workers/process';
import {PROJECT_BINDINGS} from './projects';
import type {ProjectBindings} from './project-bindings-config';
import type {HealthReport,OfficeSnapshot,ServiceHealth} from '../../src/shared';
import {ProviderStatusChecks} from './provider-status';
import {slackHealth} from './slack-health';
import {listenerHealth} from './listener-health';
import {MAX_SIGN_IN_DIAGNOSTIC_LENGTH,signInFailure,stdoutSignInFailure} from './sign-in-failure';
import {claudeLoginRefusal,refusedClaudeRow} from './claude-login-refusal';
import {withGitHubSource} from '../github/call-scope';

type ProbeResult=Pick<ServiceHealth,'status'|'detail'|'identity'|'failure'|'nextStep'>;
/** `signedOut` reads the CLI's own sign-out statement when its status command exits non-zero (Claude exits 1 after printing it). */
export type Probe={id:string;name:string;program:string;args:string[];parse:(raw:string,stderr?:string)=>ProbeResult;signedOut?:(stdout:string)=>ProbeResult|undefined;nextStep:string};
const authFailure=/not logged in|authentication|unauthorized|invalid.*token|expired.*token|login required|no active account|not authenticated|401\b/i;
/** The azure-devops extension's own words when it has no credentials at all. */
const azureNoCredentials=/Before you can run Azure DevOps commands, you need to run the login command/i;
/** The stated cause of a GitHub rate-limit refusal: a bare status code or quota advice is not one. */
export const rateLimitRefusal=/API rate limit exceeded|exceeded a secondary rate limit|\bHTTP (?:403|429)\b[^\n]*\brate limit/i;
export const credentialFailure=/(?:\bHTTP |status code:\s*)401\b|bad credentials|invalid.*token|expired.*token|not logged in/i;
/** GitHub refusing the account: a 401 in either of gh's error formats, or a stated permission or SAML refusal. A bare 403 has other causes. */
const githubRefusal=/(?:\bHTTP|status code:) 401\b|Resource not accessible by integration|\bSAML\b/i;
const UNVERIFIED_NEXT_STEP='Ellis owns the read-only checks; Morgan investigates persistent probe failures. No login change is indicated by this result.';

export function activeGitHubAccount(raw:string) {
 const hosts: { active: boolean; state: string; login?: string; error?: unknown }[] | undefined=JSON.parse(raw).hosts?.['github.com'];
 return hosts?.find(account=>account.active);
}

function githubStatus(raw:string,stderr=''):ProbeResult {
 const host=activeGitHubAccount(raw);
 if(host?.state==='success')
  return {status:'connected',identity:host.login,detail:'GitHub verified the active account. Repository and Projects permissions can still differ.'};
 // GitHub's own statement that a rate limit refused the check says nothing about sign-in; a credential failure in the same text still wins.
 if(typeof host?.error==='string'&&rateLimitRefusal.test(host.error)&&!credentialFailure.test(host.error))
  return {status:'unknown',identity:host.login,detail:'A GitHub API rate limit blocked this check. The Office could not verify sign-in.',nextStep:'Ellis will check again automatically.'};
 // A timeout, an error that is not GitHub refusing the account (DNS, 5xx, a bare 403), or no account without gh saying so is not a sign-out.
 const refused=host ? typeof host.error==='string'&&(githubRefusal.test(host.error)||credentialFailure.test(host.error)) : authFailure.test(stderr);
 if(!refused)
  return {status:'unknown',identity:host?.login,detail:host?.state==='timeout'?'GitHub’s sign-in check timed out. Login status is unverified.':'GitHub could not complete the sign-in check. Login status is unverified.',nextStep:UNVERIFIED_NEXT_STEP};
 const diagnostic=host ? host.error : authFailure.test(stderr) && stderr;
 const failure=typeof diagnostic==='string' ? signInFailure(diagnostic) : '';
 return {status:'disconnected',identity:host?.login,detail:'GitHub could not verify its active account.',...(failure&&{failure})};
}

/** Claude's status document. Only `loggedIn` and the recorded `authMethod: none` are quoted; nothing else it prints is kept. */
function claudeStatus(raw:string):ProbeResult {
 const s=JSON.parse(raw);
 if(s?.loggedIn===true)return {status:'connected',detail:'Claude reports a configured login. No model call was made.',identity:typeof s.email==='string'?s.email:undefined};
 if(s?.loggedIn===false)return {status:'disconnected',detail:'Claude reports no active login in the Office environment.',failure:signInFailure(s.authMethod==='none'?'loggedIn: false, authMethod: none':'loggedIn: false')};
 return {status:'unknown',detail:'Claude did not say whether it is signed in. Login status is unverified.',nextStep:UNVERIFIED_NEXT_STEP};
}
function claudeSignedOut(stdout:string):ProbeResult|undefined {
 try { const result=claudeStatus(stdout); return result.status==='disconnected' ? result : undefined; } catch { return undefined; }
}

const probes:Probe[]=[
 {id:'openai',name:'OpenAI · Codex',program:'codex',args:['login','status'],parse:()=>({status:'connected',detail:'Codex reports a configured login. No model call was made.'}),nextStep:'Run codex login in your terminal, then refresh. Check the Office service account if the terminal already works.'},
 {id:'anthropic',name:'Anthropic · Claude',program:'claude',args:['auth','status','--json'],parse:claudeStatus,signedOut:claudeSignedOut,nextStep:'Check Claude’s /login in your terminal, then refresh. An already logged-in terminal may differ from the Office service environment.'},
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
 /** A worker's Claude login refusal counts only after this process started and after the check's own latest signed-out reading (#552). */
 private readonly startedAt=performance.timeOrigin;private claudeSignedOutAt=0;
 /** `githubExecute` runs only the GitHub login probe (the Office's metered runner in service); public status and other probes keep `execute`. */
 constructor(private execute:typeof command=command,private githubExecute:typeof command=execute){this.providers=new ProviderStatusChecks(execute);}
 private async logins(){
  if(this.cached&&Date.now()-this.cached.at<60000)return this.cached.services;
  if(this.pending)return this.pending;
  this.pending=Promise.all(probes.map(async (p):Promise<ServiceHealth>=>{
   const stamp=()=>({kind:'login' as const,checkedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+150000).toISOString()});
   let stdout='', stderr: string | undefined='';
   const execute:typeof command=p.id==='github'?(program,args,options)=>withGitHubSource('health',()=>this.githubExecute(program,args,options)):this.execute;
   try {
    const raw=await execute(p.program,p.args,{timeout:60000,readOnly:true,onOutput:(stream,chunk)=>{
     if(stream==='stdout'){stdout+=chunk;return;}
     if(stderr===undefined)return;
     // Discard the whole diagnostic on overflow, since a fragment can lose the credential label.
     stderr=stderr.length+chunk.length<=MAX_SIGN_IN_DIAGNOSTIC_LENGTH ? stderr+chunk : undefined;
    }});
    return {nextStep:p.nextStep,...p.parse(raw,stderr),id:p.id,name:p.name,...stamp()};
   } catch(error) {
    const text=String(error),auth=authFailure.test(text)||p.program==='az'&&azureNoCredentials.test(text),timeout=/timed? out|timeout/i.test(text);
    // A CLI that exits non-zero after saying it is signed out: only an ordinary exit carries that statement, never a deadline or signal.
    const stated=/^Error: \S+ exited \d+: /.test(text) ? p.signedOut?.(stdout) : undefined;
    if(stated)return {nextStep:p.nextStep,...stated,id:p.id,name:p.name,...stamp()};
    // Empty stderr allows the stdout fallback. Overflow discards the diagnostic.
    const failure=auth ? (stderr==='' ? stdoutSignInFailure(p.program,text,stdout) : signInFailure(stderr)) : '';
    return {id:p.id,name:p.name,status:auth?'disconnected':'unknown',detail:auth?'The Office process could not authenticate.':timeout?'The read-only status check timed out after 60 seconds. Login status is unverified.':'The status command could not complete. Login status is unverified.',...(failure&&{failure}),...stamp(),nextStep:auth?p.nextStep:UNVERIFIED_NEXT_STEP};
   }
  })).then(services=>{
   const claude=services.find(s=>s.id==='anthropic');if(claude?.status==='disconnected')this.claudeSignedOutAt=Date.parse(claude.checkedAt);
   this.cached={at:Date.now(),services};return services;
  }).finally(()=>{this.pending=undefined;});
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
  const claude=services.findIndex(s=>s.id==='anthropic'),refusal=services[claude]?.status==='connected'?claudeLoginRefusal(snapshots.flatMap(s=>s.workLog??[]),this.startedAt,this.claudeSignedOutAt):undefined;
  if(refusal)services[claude]=refusedClaudeRow(services[claude],refusal);
  services.push({id:'office',name:'Office service',status:'connected',detail:'Local service is responding.',checkedAt,expiresAt:new Date(Date.parse(checkedAt)+150000).toISOString()});
  for(const s of snapshots){const listener=listenerHealth(s);if(listener)services.push(listener);}
  services.push(slackHealth(snapshots));
  return {checkedAt,context:'Login and public provider checks refresh automatically about once a minute while the Office is running. Each timestamp identifies its own check or confirmed activity. Slack updates from message readbacks; no test messages or model calls are made.',services};
 }
}
