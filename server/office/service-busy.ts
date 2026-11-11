import type {OfficeCapacity} from './projects';
import type {OfficeEntry} from '../scheduling/scheduled-work';
/** Retained reservations and durable process owners keep the deployment guard closed. */
export function serviceBusy(capacity:OfficeCapacity,entries:Iterable<OfficeEntry>):boolean {
    return !!capacity.lane||capacity.slots.size>0||capacity.active.size>0||[...entries].some(e=>
        e.store.activeClaims().length>0||e.engine.busy||e.engine.agents.active.size>0||
        e.engine.ctoAgents.active.size>0||e.engine.itAgents.active.size>0||e.engine.knowledgeAgents.active.size>0||!!e.coordinator?.polling);
}
