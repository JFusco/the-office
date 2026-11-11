import type { Store } from '../../store/store';
import type { KnowledgeRunner } from '../run-retrospective';
import type { KnowledgeSource } from './source-record';
import type { SourceRegistry } from './registry';
import { collectionAllowed } from './collection-policy';
import { SourceLedger } from './ledger';
import { runPublicReads,linkKey,type LinkRecord } from './public-reader';
import { admitUnits,type SecretScanner } from './admission';
import { digest } from '../digest';
import type { SourceUnit } from './source-unit';
import { evidenceIdentity,type EvidenceRecord } from './evidence-record';
import { ResearchResult } from '../weekly-research';
/** Reads a registered public page through the isolated reader, then scans and admits its claims privately. */
export async function collectPublicSource(store:Store,run:KnowledgeRunner,registry:SourceRegistry,source:KnowledgeSource,url:string,period:string,root:string,scan:SecretScanner):Promise<void> {
    const ledger=new SourceLedger(store,source),links=ledger.all<LinkRecord>('link').filter(l=>l.source===root),allowed=()=>collectionAllowed(registry,store,{sourceId:source.id,sourceDigest:source.sourceDigest});
    if(!allowed())return;registry.setMeta(`rotation:${store.project.id}`,source.id);
    if(!links.length)ledger.put('link',linkKey(root,url),{url,source:root,week:period,depth:0,state:'pending',failures:0,nextAt:''} satisfies LinkRecord);
    const due=ledger.all<LinkRecord>('link').filter(l=>l.source===root&&l.state==='pending'&&(!l.nextAt||Date.parse(l.nextAt)<=store.clock.now().getTime()));
    if(due.length)await runPublicReads(store,{sourceId:source.id,homeProjectId:store.project.id,sourceDigest:source.sourceDigest,publicHosts:[new URL(url).hostname]},run,due,`source:${source.id}`,registry,scan);
    if(!allowed())return;
    const collected=ledger.all<LinkRecord>('link').filter(l=>l.source===root);
    for(const link of collected.filter(l=>l.state==='read')){
        const sources=ResearchResult.shape.sources.parse(link.result).filter(r=>r.url===link.url&&r.readEvidence.startsWith('native-read:'));
        if(!sources.length)continue;
        const text=JSON.stringify(sources.map(({readEvidence,retrievedAt,...record})=>{void readEvidence;void retrievedAt;return record;})),version=digest(text),unitId=`public:${link.url}`;
        const unit:SourceUnit={id:unitId,resource:link.url,kind:'public-link',version,text,url:link.url,state:'pending',reason:'',observedAt:store.clock.now().toISOString()};
        ledger.put('unit',`${unitId}:${version}`,unit);
        await admitUnits(ledger,[unit],scan,allowed);
        if(ledger.get<{state:string}>('admission',`${unitId}:${version}`)?.state!=='admitted'){
            ledger.put('link',linkKey(link.source,link.url),{...link,state:'deferred',reason:'secret-scan-blocked'});continue;
        }
        ledger.put('unit',`${unitId}:${version}`,{...unit,state:'admitted'});
        const id=evidenceIdentity(source.id,unitId,version),evidence=ledger.get<EvidenceRecord>('evidence',id)!;
        if(evidence.readerVersion!=='public-claims-v1')ledger.put('evidence',id,{...evidence,readerVersion:'public-claims-v1',limitations:['Native public-page read; model-extracted claims remain advisory','Version hashes the admitted claims; original page bytes were not supplied by this connector','Same-host approved links only; one hop and five pages per collection']});
    }
    if(collected.length&&collected.every(l=>['read','deferred'].includes(l.state))){ledger.put('public-collection','latest',{period,at:store.clock.now().toISOString(),refresh:source.refreshRequestedAt});if(source.refreshRequestedAt){const current=registry.get(source.id);if(current?.refreshRequestedAt===source.refreshRequestedAt)registry.update(source.id,current.revision,s=>{delete s.refreshRequestedAt;});}}
}
