import type { FeatureOption, FeatureQuestion } from '../../contracts/features';
export interface RawQuestion {
    id?: string;
    question: string;
    recommendation: string;
    choices?: string[];
    options?: { id?: string; label: string; tradeoff?: string }[];
    recommendedOptionId?: string;
}
const folded = (value: string) => value.trim().normalize('NFKC').toLocaleLowerCase('en-US');
function optionId(label: string) {
    let hash = 2166136261;
    for (const c of folded(label)) { hash ^= c.codePointAt(0)!; hash = Math.imul(hash, 16777619); }
    return 'option-' + (hash >>> 0).toString(36);
}
/** Shared by persisted reader acceptance and ephemeral legacy display; never changes question IDs. */
export function normalizeQuestion(raw: RawQuestion, id: string): FeatureQuestion {
    const options: FeatureOption[] = [], identities = new Set<string>();
    const supplied = raw.options?.length ? raw.options : (raw.choices || []).map(label => ({ label, tradeoff: '' }));
    for (const option of supplied) {
        const label = option.label.trim(), key = folded(label);
        if (!key || identities.has(key)) continue;
        identities.add(key);
        let stable = optionId(label);
        while (options.some(existing => existing.id === stable)) stable += '-collision';
        options.push({id: stable, label, tradeoff: option.tradeoff?.trim() || ''});
    }
    const recommendation = raw.recommendation.trim();
    const selectedLabel = raw.recommendedOptionId ? raw.options?.find(o => o.id === raw.recommendedOptionId)?.label : undefined;
    let recommended = options.find(o => folded(o.label) === folded(selectedLabel || recommendation));
    if (!recommended && recommendation) {
        recommended = {id: optionId(recommendation), label: recommendation, tradeoff: ''};
        while (options.some(o => o.id === recommended!.id)) recommended.id += '-collision';
        options.push(recommended);
    }
    let retained = options.slice(0, 4);
    if (recommended && !retained.includes(recommended)) retained = [...retained.slice(0, 3), recommended];
    if (retained.length < 2) retained = [];
    return {id: raw.id || id, question: raw.question.trim(), recommendation, choices: retained.map(o => o.label), options: retained,
        ...(recommended && retained.includes(recommended) ? {recommendedOptionId: recommended.id} : {})};
}
