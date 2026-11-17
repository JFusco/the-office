import { azureBinding } from '../office/project-bindings';
import type { AzureBinding } from '../office/project-bindings-config';
import { command } from '../workers/process';
import { sanitize } from '../office/security';
import { azurePRDescription, collectAzureGoalDocuments } from '../leadership/goal-evidence';
import type { AzureBuild, AzurePR, OfficeProject } from '../../src/shared';
import type { Store } from '../store/store';
import { buildTiming, timelineTiming, rememberCi } from '../time/ci-timing';
import { readAzurePRs } from './observed-prs';
async function readInPairs<T,R>(items:T[],read:(item:T)=>Promise<R>):Promise<R[]>{const out:R[]=[];for(let i=0;i<items.length;i+=2)out.push(...await Promise.all(items.slice(i,i+2).map(read)));return out;}
export async function az<T>(azure:Pick<AzureBinding,'organization'|'project'>,args:string[],readOnly=false,timeout=55000,execute:typeof command=command):Promise<T>{
  const orgOnly=args[0]==='devops'||(args[0]==='repos'&&args[1]==='pr'&&['policy','show'].includes(args[2]));
  return JSON.parse(await execute('az',[...args,...(orgOnly?['--organization',azure.organization]:['--organization',azure.organization,'--project',azure.project]),'--output','json'],{timeout,readOnly}));
}
export function prUrl(project:Pick<OfficeProject,'id'|'repository'>,id:number){const azure=azureBinding(project);return `${azure.organization}/${azure.project}/_git/${project.repository}/pullrequest/${id}`;}
export function buildUrl(project:Pick<OfficeProject,'id'>,id:number){const azure=azureBinding(project);return `${azure.organization}/${azure.project}/_build/results?buildId=${id}`;}
export function correlatedBuild(pr:AzurePR,builds:AzureBuild[]) {
  const policies=pr.policies.filter(p=>p.buildId>0);
  if(!policies.length||pr.policies.some(p=>p.status!=='approved'))return undefined;
  return builds.find(b=>policies.some(p=>p.buildId===b.id)&&b.status==='completed'&&b.result==='succeeded'&&!!pr.commit&&!!pr.mergeCommit&&b.commit===pr.mergeCommit);
}
export class AzureMonitor {
  busy=false;
  constructor(private store:Store){}
  async poll() {
    if(this.busy)return;this.busy=true;this.store.state.azure.status='working';this.store.save();
    try{
      const project=this.store.project,azure=azureBinding(project),deployment=azure.deployment;
      const [rawPrs,rawBuilds]=await Promise.all([
        readAzurePRs(project.repository,args=>az(azure,args,true)),
        az<any[]>(azure,['pipelines','build','list','--top','12'],true)
      ]);
      const prs:AzurePR[]=await Promise.all(rawPrs.map(async p=>{
        let policies:AzurePR['policies']=[];
        if(p.status==='active'){
          const raw=await az<any[]>(azure,['repos','pr','policy','list','--id',String(p.pullRequestId)],true);
          policies=raw.filter(x=>x.configuration?.isEnabled&&x.configuration?.isBlocking).map(x=>({name:x.configuration?.type?.displayName||'Policy',status:x.status,buildId:Number(x.context?.buildId||0)}));
        }
        return {...azurePRDescription(p.description),id:p.pullRequestId,title:sanitize(p.title),draft:!!p.isDraft,status:p.status,source:p.sourceRefName,target:p.targetRefName,commit:p.lastMergeSourceCommit?.commitId||'',closedAt:p.closedDate||'',mergeCommit:p.lastMergeCommit?.commitId||'',url:prUrl(project,p.pullRequestId),policies};
      }));
      // Include policy builds even when newer unrelated builds displaced them from the recent-build list.
      const missing=[...new Set(prs.flatMap(p=>p.policies.map(x=>x.buildId)).filter(id=>id&&!rawBuilds.some(b=>b.id===id)))];
      const fetched=await Promise.all(missing.map(id=>az<any>(azure,['pipelines','build','show','--id',String(id)],true)));
      const observeBuild=async(b:any):Promise<AzureBuild>=>{
        const observedAt=new Date().toISOString(),cached=this.store.state.ciHistory?.find(x=>x.id===b.id);let stages:AzureBuild['stages']=[],timingError='';
        if(b.status==='completed'&&cached?.status==='completed'&&cached.finishedAt===b.finishTime&&cached.result===(b.result||'')&&cached.stages.some(s=>s.id)&&!cached.timingError)stages=cached.stages;
        else{
          try{const raw=await az<any>(azure,['devops','invoke','--area','build','--resource','timeline','--route-parameters',`project=${azure.project}`,`buildId=${b.id}`,'--api-version','7.1','--http-method','GET'],true);stages=timelineTiming(raw.records||[],observedAt);}
          catch(e){timingError=`Stage/job timing unavailable: ${sanitize(String(e))}`;stages=cached?.stages||[];}
        }
        return {id:b.id,name:b.definition?.name||'Build',status:b.status,result:b.result||'',commit:b.sourceVersion||'',branch:b.sourceBranch||'',url:buildUrl(project,b.id),stages,...buildTiming(b,observedAt),timingError};
      };
      const builds=await readInPairs([...rawBuilds,...fetched],observeBuild);
      const previous=this.store.state.azure;
      let deployed=previous.deployed;
      let deploymentError='';
      try{
        const appArgs=['--subscription',deployment.subscription,'--resource-group',deployment.resourceGroup,'--name',deployment.containerApp];
        const app=JSON.parse(await command('az',['containerapp','show',...appArgs,'--query','{revision:properties.latestReadyRevisionName,latest:properties.latestRevisionName,fqdn:properties.configuration.ingress.fqdn,traffic:properties.configuration.ingress.traffic}','--output','json'],{timeout:55000,readOnly:true}));
        const ready=JSON.parse(await command('az',['containerapp','revision','show',...appArgs,'--revision',app.revision,'--query','{containers:properties.template.containers[].{name:name,image:image},health:properties.healthState,running:properties.runningState}','--output','json'],{timeout:55000,readOnly:true}));
        const serving=app.traffic?.some((t:any)=>t.weight===100&&(t.revisionName===app.revision||(t.latestRevision&&app.latest===app.revision)));
        const image=ready.containers?.find((c:any)=>c.name===deployment.container)?.image||'';
        const buildId=Number(image.split(':').pop());
        let build=builds.find(b=>b.id===buildId);
        if(buildId&&!build){const raw=await az<any>(azure,['pipelines','build','show','--id',String(buildId)],true);build=await observeBuild(raw);builds.push(build);}
        const url=`https://${app.fqdn}`;
        const health=await fetch(`${url}${deployment.healthPath}`,{signal:AbortSignal.timeout(10000)});
        const payload=deployment.healthy==='cos'?await health.json() as {status?:string;persistence?:{ok:boolean};dbos?:{ok:boolean}}:null;
        deployed=[{environment:deployment.environment,image,revision:app.revision,url,buildId,commit:build?.commit||'',healthy:!!serving&&health.ok&&(deployment.healthy!=='cos'||payload!.status==='ok'&&payload!.persistence?.ok===true&&payload!.dbos?.ok===true),observedAt:new Date().toISOString()}];
      }catch(e){deploymentError=`Running staging version not refreshed: ${sanitize(String(e))}`;}
      rememberCi(project,this.store.state,builds,prs);
      const observedAt=new Date().toISOString();
      const observation={status:deploymentError?'blocked' as const:'idle' as const,observedAt,error:deploymentError,prs,builds,deployed,goalDocuments:previous.goalDocuments};
      const evidence=await collectAzureGoalDocuments({project:this.store.project,state:{...this.store.state,azure:observation},clock:this.store.clock},{projectId:project.id,repository:project.repository,repositoryId:azure.repositoryId,project:azure.project},args=>az(azure,args,true,15000),observedAt);
      this.store.state.azure={...observation,goalDocuments:evidence.documents,goalEvidenceGaps:evidence.gaps};
      // Deployed images are separate from a green pipeline; never infer the running version from a build result.
      const stateOf=(b:AzureBuild)=>({...b,observedAt:undefined,queueMs:undefined,durationMs:undefined,stages:b.stages.map(s=>({...s,durationMs:undefined}))});
      const changed=JSON.stringify(prs)!==JSON.stringify(previous.prs)||JSON.stringify(builds.map(stateOf))!==JSON.stringify(previous.builds.map(stateOf));
      if(changed)this.store.emit('azure-update','Azure PR, build and deployment observations updated');else this.store.save();
    }catch(e){const error=sanitize(String(e));const changed=this.store.state.azure.error!==error;this.store.state.azure.status='blocked';this.store.state.azure.error=error;this.store.save();if(changed)this.store.emit('azure-blocked','Azure connection needs attention. Previous observations are retained.');}
    finally{this.busy=false;}
  }
}
