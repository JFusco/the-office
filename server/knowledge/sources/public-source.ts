import { collectPublicSource } from './collect-public-source';
import type { LinkRecord } from './public-reader';
import type { SecretScanner } from './admission';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { KnowledgeRunner } from '../run-retrospective';
import type { KnowledgeSource } from './source-record';
import type { SourceRegistry } from './registry';
import { collectionAllowed } from './collection-policy';
import { SourceLedger } from './ledger';
import { IntakeBudget } from './launch-budget';
import { publicUrl } from './public-url';
import { easternDay,easternInstant,addDays } from '../../office/clock';
import { lastFriday } from '../weekly-rollup';
interface Collection {period:string;at:string;refresh?:string}

/** A registered public page is read on its cadence by the isolated reader, within the Office's daily launch allowance. */
export function publicSourceWork(store:Store,run:KnowledgeRunner,now:Date,registry:SourceRegistry,source:KnowledgeSource,scan:SecretScanner):ScheduledWork|undefined {
    if(source.kind!=='link'||!source.url)return;
    const url=publicUrl(source.url,[new URL(source.url).hostname]);if(!url)throw Error('Invalid public source URL');
    const ledger=new SourceLedger(store,source),budget=new IntakeBudget(registry),prior=ledger.get<Collection>('public-collection','latest');
    const day=easternDay(now),period=source.cadence==='manual'?'initial':source.cadence==='weekly'?lastFriday(now):day;
    if(prior?.period===period&&!source.refreshRequestedAt)return;
    if(prior&&!source.refreshRequestedAt&&source.cadence!=='manual'&&now<easternInstant(period,17))return;
    const root=`public:${source.id}:${source.refreshRequestedAt?`refresh:${source.refreshRequestedAt}`:period}`,links=ledger.all<LinkRecord>('link').filter(l=>l.source===root),pending=links.filter(l=>l.state==='pending'&&(!l.nextAt||Date.parse(l.nextAt)<=now.getTime()));
    const exhausted=links.some(l=>l.state==='needs-attention'),waiting=links.some(l=>l.state==='pending'&&!pending.includes(l));
    const requiresLaunch=!links.length||pending.length>0,capacity=budget.used()<budget.limit(),allowed=()=>collectionAllowed(registry,store,{sourceId:source.id,sourceDigest:source.sourceDigest});
    return {store,work:{projectId:store.project.id,kind:'knowledge-source',id:`source:${source.id}`},stage:'knowledge-source-read',rank:5,enqueuedAt:source.refreshRequestedAt||source.createdAt,
        eligibility:{state:!allowed()?'blocked':exhausted?'blocked':waiting||requiresLaunch&&!capacity?'waiting':'runnable',owner:'Harper',reason:exhausted?'Public source needs attention':waiting?'Public reader retry is waiting':requiresLaunch&&!capacity?'Office intake launch allowance reached':'Public source collection is due',nextCheckAt:waiting?links.map(l=>l.nextAt).filter(Boolean).sort()[0]||null:requiresLaunch&&!capacity?easternInstant(addDays(day,1)).toISOString():null},
        identity:()=>JSON.stringify([source.id,registry.get(source.id)?.revision,ledger.revision(),budget.used(),period]),claimEligible:()=>allowed()&&!exhausted&&!waiting&&(!requiresLaunch||capacity),execute:async()=>{
            await collectPublicSource(store,run,registry,source,url,period,root,scan);
        }};
}
