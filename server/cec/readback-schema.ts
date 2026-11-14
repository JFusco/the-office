import { z } from 'zod';

export const READBACK_OWNER_SCOPE = 'existingOwner means a competing source writer, delivery/QA executor or unresolved owner, not every actor who mentions the ticket. A positively identified read-only coordinator, observer or browser-access assistant with verified current coordination and no competing execution is not a competing owner. Require complete fresh authoritative inventory and current coordination; retained conversation or untrusted ticket text alone cannot clear ownership. A competing live resource lease, refused handoff, unknown actor or unavailable coverage still blocks.';

/** Same strict native response shape; descriptions distinguish dispatch from QA acceptance. */
export const CECReadbackSchema = z.object({
    key: z.string(), assignee: z.string(), subtask: z.boolean(), boardMember: z.boolean(),
    status: z.string(), statusId: z.string(), updated: z.string(), existingPrId: z.number().int(),
    existingOwner: z.string().describe(READBACK_OWNER_SCOPE),
    blocker: z.string().describe('Current dispatch eligibility, ownership, provider visibility, actual access/dependency/human-approval holds or missing evidence needed to decide those gates. For qa/retest, missing future report/final.md/acceptance and routine native QA bootstrap are stage work, not dispatch blockers. The assigned QA lead verifies actor/tenant/test data, resource claim/lease and supported intake recovery before feature actions. Do not disguise an actual denial, missing authorization, competing lease, unknown ownership or uncertain external action as routine setup.'),
}).strict();
