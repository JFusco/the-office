import { z } from 'zod';
const text = z.string().trim().min(1).max(3000);
const LegacyOfficeQAReportSchema = z.object({
    version: z.literal(1), ticket: text, commit: z.string().regex(/^[a-f0-9]{40}$/), stage: text,
    validation: z.enum(['independent-checks', 'browser']),
    setup: z.object({ status: z.enum(['ready', 'blocked']), summary: text, owner: text, nextAction: text,
        url: z.string().max(5000), actor: z.string().max(500), resources: z.array(text).max(16) }).strict(),
    cases: z.array(z.object({ id: text, check: text, kind: z.enum(['acceptance', 'regression']),
        status: z.enum(['passed', 'failed', 'blocked', 'not-tested']), expected: text, observed: text,
        evidenceIds: z.array(text).max(16) }).strict()).max(100),
    nextOwner: text, nextAction: text,
}).strict();
/** New assignments use references; saved v1 reports retain their original contract. */
export const CurrentOfficeQAReportSchema = LegacyOfficeQAReportSchema.extend({
    version: z.literal(2),
    cases: z.array(LegacyOfficeQAReportSchema.shape.cases.element.extend({ criterionId: text.nullable() }).strict()).max(100),
}).strict();
export const OfficeQAReportSchema = z.union([CurrentOfficeQAReportSchema, LegacyOfficeQAReportSchema]);
