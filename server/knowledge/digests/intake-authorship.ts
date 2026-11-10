import type { SourceUnit,IntakeResultValue } from '../slack-intake/contracts';
import type { SourceRegistry } from '../sources/registry';
import type { IntakeLedger } from '../slack-intake/ledger';
import { unitAuthorship } from './authorship';
import { evidenceIdentity,type EvidenceRecord } from '../sources/evidence-record';
const limitation='Confirmed Office-authored digest or identified repost; not independent corroboration';

/** Late confirmation adds metadata only; source versions, capture requests and effects stay unchanged. */
export function annotateAuthoredUnits(ledger:IntakeLedger,registry:SourceRegistry,origin:string,units:SourceUnit[]):void {
    for(const unit of units){const authorship=unitAuthorship(registry,origin,unit);if(!authorship)continue;unit.authorship=authorship;
        const key=`${unit.id}:${unit.version}`,saved=ledger.get<SourceUnit>('unit',key);if(saved&&!saved.authorship)ledger.put('unit',key,{...saved,authorship});
        if(ledger.source){const id=evidenceIdentity(ledger.source.id,unit.id,unit.version),record=ledger.get<EvidenceRecord>('evidence',id);if(record&&record.independent!==false)ledger.put('evidence',id,{...record,independent:false,limitations:[limitation,...record.limitations]});}
    }
}
/** A grouped proposal containing Office output cannot become an independent technical capture. */
export function independentIntakeResult(value:IntakeResultValue,units:SourceUnit[]):IntakeResultValue {
    const authored=new Set(units.filter(u=>u.authorship).map(u=>u.id)),proposals=value.proposals.filter(p=>!p.units.some(id=>authored.has(id)));
    return {...value,proposals,units:value.units.map(u=>authored.has(u.id)?{...u,outcome:'no-reusable-lesson',reason:limitation}:u.outcome==='proposed'&&!proposals.some(p=>p.units.includes(u.id))?{...u,outcome:'deferred',reason:'Grouped proposal included Office-authored output; independent evidence requires separate review'}:u)};
}
