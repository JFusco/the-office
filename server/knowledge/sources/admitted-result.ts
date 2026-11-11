import type { IntakeLedger } from '../slack-intake/ledger';
import type { SourceUnit } from '../slack-intake/contracts';
import { EvidenceResult } from './project-evidence';

/** Private acquisition output stays retained; only clean units may leave it. */
export function admittedResult(ledger:IntakeLedger,value:unknown,observed:SourceUnit[]) {
    const parsed=EvidenceResult.parse(value);
    const returned=new Set(observed.map(unit=>unit.id));
    if(new Set(parsed.units.map(unit=>unit.id)).size!==parsed.units.length||parsed.units.some(unit=>!returned.has(unit.id)))throw Error('intake-unit-coverage-mismatch');
    const blocked=new Set(observed.filter(unit=>ledger.get<{state:string}>('admission',`${unit.id}:${unit.version}`)?.state==='blocked').map(unit=>unit.id));
    return {units:observed.filter(unit=>!blocked.has(unit.id)),result:{...parsed,units:parsed.units.filter(unit=>!blocked.has(unit.id))}};
}
