import type {FeatureRound} from '../contracts/features';
import {QuestionStepper} from './questions/QuestionStepper';
export function QuestionRound({project,feature,round,busy,submit,act}:{project:string;feature:string;round:FeatureRound;busy:boolean;submit:(answers:Record<string,string>)=>Promise<boolean>;act?:(input:{operation:'apply';optionId:string}|{operation:'note';note:string})=>Promise<boolean>}) {
    return <QuestionStepper project={project} feature={feature} round={{...round,roundId:round.id,asker:round.author??(round.reviewRevision!==undefined?'review':'product')}} busy={busy} submit={submit} act={act}/>;
}
