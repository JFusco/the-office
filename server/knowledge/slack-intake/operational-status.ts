import type { SlackIntakeStatus } from '../../../src/contracts/knowledge';
import type { WorkClaim } from '../../../src/contracts/work';
import type { WorkTime } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import { addDays,easternDay,easternInstant } from '../../office/clock';
import type { SourceRegistry } from '../sources/registry';
import { collectionPolicy } from '../sources/collection-policy';
import { sourceVisible } from '../sources/visibility';
import { IntakeBudget } from '../sources/launch-budget';
import { readMethod } from './observations';
import type { ReadTask } from './contracts';
import { IntakeLedger } from './ledger';
import { intakeStatusMetrics,combineIntakeMetrics,type IntakeMetrics } from './status-metrics';
/** Same ownership rule the Office uses to settle stopped work sessions. */
export const isStoppingFor=(w:WorkTime,claim:WorkClaim)=>w.status==='stopping'&&(w.claimId?w.claimId===claim.id:w.requestId===claim.work.id);
/** Aggregate home-owned source streams; the registry and the actual scheduler are the sole authorities. */
export function reconcileIntakeStatus(store:Store,work:ScheduledWork[],now:Date,registry?:SourceRegistry,projectionInvalid=false):void {
    if(!store.state.knowledge)return;
    const sources=registry?.home(store.project.id).filter(s=>s.kind==='slack'&&sourceVisible(registry,s.id,store.project.id))||[],rows:IntakeMetrics[]=[],ledgers: {ledger:IntakeLedger;id:string}[]=[];
    let configuration:SlackIntakeStatus['configuration']=!registry||!sources.length?'missing':registry.meta<{state:string}>('cutover')?.state!=='ready'?'changed':'valid';
    if(projectionInvalid)configuration='invalid';
    const extraRetries:string[]=[];
    for(const source of sources)try{
        const policy=collectionPolicy(source),ledger=new IntakeLedger(store,source);ledgers.push({ledger,id:source.id});rows.push(intakeStatusMetrics(ledger));
        if(ledger.columns<Pick<ReadTask,'status'|'sourceId'|'sourceDigest'|'channel'>>('task',['status','sourceId','sourceDigest','channel']).some(t=>t.status!=='complete'&&(t.sourceId!==source.id||t.sourceDigest!==source.sourceDigest||t.channel!==policy.channels[0].id)))configuration='changed';
        const budget=new IntakeBudget(registry!);for(const method of Object.values(policy.tools)){const until=budget.backoff(policy.workspace,policy.appId,method);if(until)extraRetries.push(until);}
    }catch{configuration='invalid';}
    const {retryTimes,...metrics}=combineIntakeMetrics(rows),claim=store.activeClaims().find(c=>c.work.kind==='knowledge-slack-intake');
    const current=claim&&ledgers.find(s=>claim.work.id===`source:${s.id}`)?.ledger;
    const task=current?.columns<Pick<ReadTask,'status'|'processing'>>('task',['status','processing']).find(t=>t.status==='running');
    const ready=work.find(w=>w.eligibility.state==='runnable'),wait=work.find(w=>w.eligibility.state==='waiting');
    const nextRetry=[...retryTimes,...extraRetries].filter(at=>Date.parse(at)>now.getTime()).sort()[0];
    const day=easternDay(now),budget=registry?new IntakeBudget(registry):undefined,launches=budget?.used(day)||0,dailyLimit=Math.max(8,...sources.filter(s=>s.state==='active').map(s=>budget!.limit(s.id)));
    const enabled=store.state.knowledge.enabled&&sources.some(s=>s.state==='active'),paused=store.state.paused||!!sources.length&&sources.every(s=>s.state==='paused');
    let activity:SlackIntakeStatus['activity'];
    if(claim){const stopping=claim.status==='stopping'||!!store.state.workLog?.some(w=>isStoppingFor(w,claim)),running=store.state.workLog?.find(w=>w.claimId===claim.id&&w.status==='running');
        activity=stopping?'stopping':running?.stage==='knowledge-slack-links'?'reading-references':task?.processing?'classifying':task?'reading':'working';
    }else if(configuration==='invalid'||configuration==='changed')activity='needs-attention';
    else if(paused||store.state.draining)activity='paused';
    else if(!enabled)activity='disabled';
    else if(ready)activity='queued';else if(wait)activity='waiting-budget';else if(nextRetry)activity='waiting-retry';
    else if(launches>=dailyLimit&&metrics.pendingReads>metrics.failedReads)activity='waiting-budget';
    else if(metrics.pendingReads||metrics.unresolvedSources)activity='needs-attention';
    else activity=store.state.knowledge.slackSeed?.status==='complete-with-gaps'?'caught-up':'waiting';
    const budgetAt=wait?.eligibility.nextCheckAt||(activity==='waiting-budget'?easternInstant(addDays(day,1)).toISOString():undefined);
    const nextAttemptAt=[budgetAt,nextRetry].filter((at):at is string=>!!at).sort((a,b)=>Date.parse(a)-Date.parse(b))[0];
    const value:Omit<SlackIntakeStatus,'changedAt'>={...metrics,activity,configuration,enabled,paused,draining:!!store.state.draining,needsAttention:configuration==='invalid'||configuration==='changed'||metrics.failedReads>0||metrics.sourceErrors>0||activity==='needs-attention',day,launches,dailyLimit,...(claim?{activeSince:claim.claimedAt}:{}),...(!claim&&nextAttemptAt?{nextAttemptAt}:{})};
    const {changedAt:_changedAt,...prior}=store.state.knowledge.slackIntake||{};
    if(JSON.stringify(prior)!==JSON.stringify(value)){store.state.knowledge.slackIntake={...value,changedAt:now.toISOString()};store.save();}
}
