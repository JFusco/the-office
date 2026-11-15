import { createHash } from 'node:crypto';
/** Reviewed CEC-154 scope. Never replaces actual plan compilation, browser proof or provider gates. */
export const reviewedPlanGuidance = `ONE CORRECTED CEC-154 PLAN. The previous incomplete plan is retained, not passed. Do not replay its actions or reuse its report.
Before sealing: verify actual actor/tenant, current full candidate/deployment, supported browser claim/lease, eligible fixture workflow states and normal provider budget. Use only Joe and disposable local records; no grants, role removals, shared/production edits or deployment. Count setup generations too. Review and save the complete plan against the ticket and these groups before execution. Each writeback criterion needs actual mutation and reopened persistence checks, not navigation or text presence. Use unique scoped role/test locators. Missing coverage stays blocked; never silently omit it.
1. Saved Page Type: select real feedback, generate actual proposal, review/accept in UI, reopen saved version/history/comments. Preserve protected fields/structure/references.
2. Mixed prose and structural feedback: apply only permitted prose; structural feedback explicitly remains unresolved.
3. Stale proposal and supported unauthorized boundary: refuse without changing current saved version/decisions or dispatching provider work. Never remove Joe roles or invent unauthorized proof.
4. Actual regeneration: authored prose, Page Fields and intentional clears survive; structural changes remain individually decidable.
5. Actual structure refresh: source digest and projected regions update atomically; authored prose, Page Fields and references retain accepted precedence.
6. Prior findings: committed replay preserves newer decisions, obsolete removal refuses, repeated rows have independent identity/decisions. Distinguish retained source/DB checks from live browser proof.
7. Adjacent Component: verify eligible Functional Spec workflow state (not locked Draft), then real feedback proposal and saved revision.
8. Adjacent Non-Visual: verify documented eligible state, then real feedback proposal and saved revision.
Retain all old fixtures/artifacts/errors and unperformed cases as history. Produce complete report.json/final.md and screenshot/network/console, real provider usage and owned cleanup evidence for this new plan. No additional replacement run. Normal independent acceptance, Azure policies and Jira Ready for Staging remain required. STOP before COS merge/deployment.`;
export const reviewedPlanGuideDigest = createHash('sha256').update(reviewedPlanGuidance).digest('hex');
