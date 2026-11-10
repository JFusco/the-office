import type { KnowledgeContext } from '../context';
import { reconcileDigestAuthorship,unitAuthorship,type AuthoredDigest } from './authorship';
import { annotateAuthoredUnits } from './intake-authorship';
import { IntakeLedger } from '../slack-intake/ledger';
import type { SourceUnit } from '../slack-intake/contracts';
import { digest } from '../slack-intake/config';

/** Revision-gated metadata reconciliation also handles sends confirmed after initial collection. */
export function reconcileAuthoredEvidence(context:KnowledgeContext):void {
    reconcileDigestAuthorship(context);
    const records=context.registry.meta<AuthoredDigest[]>('authored-knowledge-digests')||[];
    if(!records.length)return;
    const revision=digest(JSON.stringify(records));
    for(const source of context.registry.all()) {
        if(source.kind!=='slack'||context.registry.meta<string>(`digest-authorship:${source.id}`)===revision)continue;
        const home=context.stores.get(source.homeProjectId);if(!home)continue;
        const ledger=new IntakeLedger(home,source);
        for(const row of ledger.columns<{id:string;version:string;url:string;channel:string;ts:string;references:string|null}>('unit',['id','version','url','channel','ts','references'])) {
            const metadata={...row,references:row.references?JSON.parse(row.references):[]};
            const linked=records.some(r=>r.origin===source.authority!.workspace&&metadata.references.some((ref:{id:string;url?:string})=>ref.id===r.permalink||ref.url===r.permalink));
            if(!unitAuthorship(context.registry,source.authority!.workspace,metadata)&&!linked)continue;
            const unit=ledger.get<SourceUnit>('unit',`${row.id}:${row.version}`);if(!unit)continue;
            if(!unitAuthorship(context.registry,source.authority!.workspace,unit))continue;
            annotateAuthoredUnits(ledger,context.registry,source.authority!.workspace,[unit]);
            for(const store of context.stores.values())for(const lesson of store.state.knowledge?.lessons||[])if(lesson.sourceReviewReason!=='office-authored'&&lesson.evidence.some(p=>p.kind==='source'&&p.source?.sourceId===source.id&&p.source.unitId===row.id&&p.source.version===row.version)){lesson.needsReview=true;lesson.sourceReviewReason='office-authored';store.save();}
        }
        context.registry.setMeta(`digest-authorship:${source.id}`,revision);
    }
}
