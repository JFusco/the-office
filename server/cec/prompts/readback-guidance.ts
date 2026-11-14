import type { Ticket } from '../../../src/shared';
import { READBACK_OWNER_SCOPE } from '../readback-schema';

/** The PM checks assignment eligibility; the assigned QA lead owns its run setup. */
export function readbackDispatchGuidance(ticket?: Pick<Ticket, 'stage' | 'approach'>): string {
    const owner = `\nREADBACK OWNER SCOPE: ${READBACK_OWNER_SCOPE}`;
    if (!ticket || !['qa', 'retest'].includes(ticket.stage)) return owner;
    const browser = !ticket.approach || ticket.approach.validation === 'browser';
    return `${owner}
QA DISPATCH BOUNDARY: This ticket awaits ${ticket.stage}; this read-back decides whether that stage can be assigned, not whether it has passed. Do not require its future report.json, final.md or completed acceptance before dispatch. ${browser ? 'The assigned native QA lead owns current actor/editor permissions, tenant/test-data qualification, resource claim/lease and supported same-run browser recovery/intake-origin revision. These must be verified through the QA Team lifecycle before feature actions; a coordinated run-owned browser handoff may be prepared without claiming an existing QA lease.' : 'The assigned QA lead owns the selected check-based validation; do not invent a browser, browser lease or browser-intake prerequisite.'}
Do not perform QA setup or feature checks in this read-only PM assignment. A confirmed access denial, missing human authorization, human hold, unavailable authoritative ownership, competing execution/live lease or uncertain external action remains blocking. If current eligibility/ownership/provider/hold checks pass and only ordinary QA setup and acceptance remain, return blocker="" and the verified live dispatch fields. This does not accept QA or waive the harness's saved-plan, uncertain-action, usage, stage-result or deployment/version gates.`;
}
