import type { KnowledgeContext } from '../context';
import { knowledgeActivity } from '../activity';

export function knowledgeActivityPage(context:KnowledgeContext,project:string) {
    return knowledgeActivity(context,project);
}
