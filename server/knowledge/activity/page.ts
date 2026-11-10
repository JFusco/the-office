import type { KnowledgeContext } from '../context';
import { knowledgeActivity } from '../activity';
import { publicationConnections } from '../map/publications';
import { intakeActivity } from './intake-status';

export async function knowledgeActivityPage(context:KnowledgeContext,project:string) {
    const publications=await publicationConnections(context,project);
    // Rebuild all private projections after the external read-back and its grant checks.
    return {...knowledgeActivity(context,project),intake:intakeActivity(context,project),
        publications:publications.nodes.flatMap(node=>node.knowledgeReference?[{id:node.id,title:node.title,reference:node.knowledgeReference,evidenceCount:publications.edges.filter(edge=>edge.target===node.id).length}]:[]),
        publicationLimit:'Read-back covers at most four original capture requests and four committed notes. Unknown or unavailable lineage is omitted; no publication time is inferred.',
    };
}
