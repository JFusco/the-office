import { randomUUID } from 'node:crypto';
import { normalizeQuestion, type RawQuestion } from '../../../src/features/questions/normalize-question';
/** Called once for a new round; helper finding IDs and saved IDs are retained verbatim. A missing or repeated ID gets a fresh one. */
export function normalizeRound(questions: RawQuestion[]) {
    if (questions.length > 3) throw new Error('A question round may contain at most three questions');
    const assigned = new Set<string>();
    return questions.map(question => {
        const id = question.id && !assigned.has(question.id) ? question.id : randomUUID();
        assigned.add(id);
        return normalizeQuestion({ ...question, id }, id);
    });
}
