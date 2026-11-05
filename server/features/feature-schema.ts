import { z } from 'zod';

const text = z.string().trim().min(1);
const identity = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const ManifestSchema = z.object({
    provider: z.enum(['github', 'azure']), destination: text,
    items: z.array(z.object({ id: identity, title: text, key: z.string(), action: z.enum(['create', 'update']), predecessor: z.string(),
        criteria: z.array(text).min(1), review: z.enum(['focused', 'full']).optional(), validation: z.enum(['developer-checks', 'independent-checks', 'browser']).optional(), checks: z.array(text).optional(), operations: z.array(z.object({ id: identity, kind: z.enum(['create', 'update', 'assign', 'board', 'transition']), payload: z.record(z.string(), z.unknown()), expected: z.record(z.string(), z.unknown()) }).strict()).min(1) }).strict()).min(1).max(30),
}).strict().superRefine((manifest, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of manifest.items.entries()) {
        if (seen.has(item.id) || item.predecessor && !seen.has(item.predecessor)) ctx.addIssue({ code: 'custom', message: 'Unique items must follow their predecessors', path: ['items', index] });
        seen.add(item.id);
        if (item.operations[0]?.kind !== item.action || item.action === 'update' && item.operations.some(op => op.kind === 'create') || item.operations.filter(op => op.kind === 'update').length > 1 || item.operations.filter(op => op.kind === 'assign').length > 1)
            ctx.addIssue({ code: 'custom', message: 'Content must precede eligibility operations with one final assignment', path: ['items', index] });
        if (item.key && manifest.items.filter(other => other.key === item.key).length !== 1)
            ctx.addIssue({ code: 'custom', message: 'Ticket identities must be unique', path: ['items', index] });
        const contentEnd = Math.max(...item.operations.map((op, i) => ['create', 'update'].includes(op.kind) ? i : -1));
        if (item.operations.slice(0, contentEnd).some(op => !['create', 'update'].includes(op.kind)))
            ctx.addIssue({ code: 'custom', message: 'Content cannot change after enabling assignment or board placement', path: ['items', index] });
        if (new Set(item.operations.map(op => op.id)).size !== item.operations.length) ctx.addIssue({ code: 'custom', message: 'Duplicate operation ID', path: ['items', index] });
        if (item.action === 'update' && !item.key || item.action === 'create' && (item.key || item.operations.filter(op => op.kind === 'create').length !== 1)) ctx.addIssue({ code: 'custom', message: 'Create/update identity is inconsistent', path: ['items', index] });
    }
});
export const DiscoverySchema = z.object({ summary: text, brief: text, questions: z.array(z.object({ question: text, recommendation: text, choices: z.array(text).max(4) }).strict()).max(3), ready: z.boolean() }).strict();
export const PlanSchema = z.object({ summary: text, markdown: text, scope: z.array(text).min(1), questions: z.array(z.object({ question: text, recommendation: text, choices: z.array(text).max(4) }).strict()).max(3) }).strict();
export const FeatureCommandSchema = z.discriminatedUnion('action', [
    z.object({ action: z.literal('create'), requestId: text, title: text.max(200), intent: text.max(20000), sourceGoalId: z.string().default(''), sourceTicket: z.string().default('') }).strict(),
    z.object({ action: z.literal('answer'), requestId: text, expectedRevision: z.number().int().positive(), roundId: text, answers: z.record(z.string(), text.max(10000)) }).strict(),
    z.object({ action: z.literal('create-plan'), requestId: text, expectedRevision: z.number().int().positive(), briefDigest: text }).strict(),
    z.object({ action: z.literal('revise'), requestId: text, expectedRevision: z.number().int().positive(), instruction: text.max(20000) }).strict(),
    z.object({ action: z.literal('approve'), requestId: text, expectedRevision: z.number().int().positive(), planDigest: text, manifestDigest: text }).strict(),
    ...(['pause', 'resume', 'reconcile'] as const).map(action => z.object({ action: z.literal(action), requestId: text, expectedRevision: z.number().int().positive() }).strict()),
]);
export function manifestFromPlan(markdown: string) {
    const matches = [...markdown.matchAll(/```feature-manifest\s*\n([\s\S]*?)\n```/g)];
    if (matches.length !== 1) throw new Error('Plan must contain exactly one feature-manifest block');
    return ManifestSchema.parse(JSON.parse(matches[0][1]));
}
