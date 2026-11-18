import type { Store } from '../store/store';
import type { Ticket } from '../../src/shared';
import { unrecordedStageResult } from './unrecorded-result';

/** Sam's one revised-approach assessment ran and returned, but its result is on the attempt and not on the ticket. */
export function returnedAssessment(store: Store, ticket: Ticket): boolean {
    return ticket.stage === 'code-review' && ticket.repairCycle?.phase === 'diagnosis' && !!ticket.repairCycle.diagnosisAttempted && !!unrecordedStageResult(store, ticket, 'code-review');
}
