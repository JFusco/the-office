import type { KnowledgeContext } from '../context';
import type { KnowledgeIntakeStatus } from '../../../src/contracts/knowledge-views';
import { IntakeLedger } from '../slack-intake/ledger';
import { sourceVisible } from '../sources/visibility';

/** Current persisted status, separate from the timeline. */
export function intakeActivity(context: KnowledgeContext, project: string): KnowledgeIntakeStatus[] {
    const rows: KnowledgeIntakeStatus[] = [];
    for (const source of context.registry.all()) {
        if (!sourceVisible(context.registry, source.id, project)) continue;
        const home = context.stores.get(source.homeProjectId);
        if (!home) continue;
        const ledger = new IntakeLedger(home, source);
        for (const task of ledger.columns<{id:string;status:string;createdAt:string}>('task', ['id','status','createdAt']).slice(-20)) {
            rows.push({id:`collection:${source.id}:${task.id}`,source:source.title,kind:'collection',status:task.status,queuedAt:task.createdAt,
                detail:'Collection task status. A completed read does not establish admission.'});
        }
    }
    return rows.slice(-50);
}
