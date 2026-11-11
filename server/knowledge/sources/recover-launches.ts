import type { Store } from '../../store/store';
import { processGroupAlive } from '../../workers/process';
import type { SourceRegistry } from './registry';
import { IntakeBudget } from './launch-budget';

/** Run before scheduling, after Store recovery. Only absent source owners may settle. */
export function recoverStoppedLaunches(registry:SourceRegistry,stores:Map<string,Store>,alive=processGroupAlive):number {
    const rows=registry.db.prepare("SELECT attempt,source_id FROM knowledge_launches WHERE state='reserved'").all() as {attempt:string;source_id:string}[];
    const budget=new IntakeBudget(registry);let changed=0;
    for(const row of rows){
        const source=registry.get(row.source_id),store=source&&stores.get(source.homeProjectId);if(!source||!store)continue;
        const requestId=`source:${source.id}`;
        if(store.activeClaims().some(claim=>claim.work.id===requestId))continue;
        const work=store.state.workLog?.filter(work=>work.requestId===requestId&&work.stage==='knowledge-source-read').at(-1);
        if(work&&(['running','stopping'].includes(work.status)||work.status==='interrupted'&&work.processId&&alive(work.processId)))continue;
        if(budget.settleOrphan(row.attempt))changed++;
    }
    return changed;
}
