import { z } from 'zod';
const text = z.string().trim().min(1).max(3000);
export const OfficeQAReportSchema = z.object({
    version: z.literal(1), ticket: text, commit: z.string().regex(/^[a-f0-9]{40}$/), stage: text,
    validation: z.enum(['independent-checks', 'browser']),
    setup: z.object({ status: z.enum(['ready', 'blocked']), summary: text, owner: text, nextAction: text,
        url: z.string().max(5000), actor: z.string().max(500), resources: z.array(text).max(16) }).strict(),
    cases: z.array(z.object({ id: text, check: text, kind: z.enum(['acceptance', 'regression']),
        status: z.enum(['passed', 'failed', 'blocked', 'not-tested']), expected: text, observed: text,
        evidenceIds: z.array(text).max(16) }).strict()).max(100),
    nextOwner: text, nextAction: text,
}).strict();
