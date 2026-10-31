import type { Offices } from '../scheduling/offices';
import type { ServiceHealthChecks } from '../office/service-health';
import type { Store } from '../store/store';
import type { ITFollowUp, ITState, TeamMessage, TicketJob } from '../../src/shared';
import type { HarnessRequest } from '../../src/contracts/work';

/** Everything one project check shares across its sections. */
export interface ITContext {
    offices: Offices; store: Store; engine: ReturnType<Offices['get']>['engine']; coordinator: ReturnType<Offices['get']>['coordinator'];
    state: Store['state']; it: ITState; actions: string[]; followUps: ITFollowUp[]; current: Set<string>; now: Date;
    health: Awaited<ReturnType<ServiceHealthChecks['report']>>; nextAt: number;
    retainedCloseouts: Set<string>; services: Awaited<ReturnType<ServiceHealthChecks['report']>>['services'];
    retainedPartials: { job: TicketJob; key: string; recovery: ITState['recoveries'][string] }[];
    activationBudget: (id: string) => { job: TicketJob; requests: HarnessRequest[]; pending?: HarnessRequest; foreignPending: boolean; source: boolean } | undefined;
    recover: (id: string, detail: string, run: () => Promise<boolean | string | HarnessRequest | TeamMessage>, nextStep: string, owner?: ITFollowUp['owner']) => Promise<void>;
}
