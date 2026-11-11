import type { KnowledgeContext } from '../context';
import { knowledgeActivity } from '../activity';
import { intakeActivity } from './intake-status';

export function knowledgeActivityPage(context:KnowledgeContext,project:string) {
    return {...knowledgeActivity(context,project),intake:intakeActivity(context,project)};
}
