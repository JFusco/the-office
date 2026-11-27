import { collectOpinion, otherProvider, type Budgeted, type FrozenInput, type Opinion, type Provider } from './triage';

/**
 * The blind second opinion: the other provider, on the same frozen input, in its own fresh session.
 * It is given only which provider the triage launched and the identity of the input it saw, never
 * the triage's verdict. Admitted once, in round 1.
 */
export interface SecondOpinionRequest {
    budgeted: Budgeted;
    input: FrozenInput;
    first: { provider: Provider; inputIdentity: string };
}

export async function collectSecondOpinion({ budgeted, input, first }: SecondOpinionRequest): Promise<Opinion> {
    const provider = otherProvider(first.provider);
    return collectOpinion({ budgeted, stage: 'second-opinion', round: 1, provider, input }, first.inputIdentity);
}
