import type { CollectionPolicy } from './collection-policy';
import type { IntakeLedger } from '../slack-intake/ledger';
import { IntakeResult,type SourceUnit } from '../slack-intake/contracts';
import { assertProposalScope } from '../slack-intake/proposal-scope';
import { EvidenceResult } from './project-evidence';

/** Private acquisition output stays retained; only clean units and unmixed claims may leave it. */
export function admittedResult(ledger:IntakeLedger,config:CollectionPolicy,value:unknown,observed:SourceUnit[]) {
    const parsed=config.destination==='technical-brain'?IntakeResult.parse(value):EvidenceResult.parse(value);
    const returned=new Map(observed.map(unit=>[unit.id,unit]));
    const reported=new Map(parsed.units.map(unit=>[unit.id,unit]));
    if(reported.size!==parsed.units.length||parsed.units.some(unit=>!returned.has(unit.id)))throw Error('intake-unit-coverage-mismatch');
    const blocked=new Set(observed.filter(unit=>ledger.get<{state:string}>('admission',`${unit.id}:${unit.version}`)?.state==='blocked').map(unit=>unit.id));
    const units=observed.filter(unit=>!blocked.has(unit.id));
    if(!('proposals' in parsed))return {units,result:{...parsed,units:parsed.units.filter(unit=>!blocked.has(unit.id))}};
    for(const proposal of parsed.proposals)assertProposalScope(config,proposal,returned,reported);
    const proposals=parsed.proposals.filter(proposal=>!proposal.units.some(id=>blocked.has(id)));
    return {units,result:{...parsed,proposals,units:parsed.units.filter(unit=>!blocked.has(unit.id)).map(unit=>unit.outcome==='proposed'&&!proposals.some(proposal=>proposal.units.includes(unit.id))?{...unit,outcome:'deferred' as const,reason:'Capture group includes scan-withheld evidence; separate clean support before reconsideration'}:unit)}};
}
