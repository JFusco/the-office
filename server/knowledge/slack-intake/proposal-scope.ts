import type { CollectionPolicy } from '../sources/collection-policy';
import type { IntakeResultValue,SourceUnit } from './contracts';

/** Validate original provider scope before withholding any unsafe source group. */
export function assertProposalScope(config:Pick<CollectionPolicy,'domains'>,proposal:IntakeResultValue['proposals'][number],returned:ReadonlyMap<string,SourceUnit>,reported:ReadonlyMap<string,{outcome:string}>):void {
    if(!config.domains.includes(proposal.domain)||!proposal.body.trim()||Buffer.byteLength(proposal.body)>16384||!proposal.units.length||new Set(proposal.units).size!==proposal.units.length)throw Error('invalid-intake-proposal');
    if(proposal.units.some(id=>!returned.has(id)||reported.get(id)?.outcome!=='proposed'))throw Error('unobserved-intake-proposal');
}
