import { z } from 'zod';
export const OfficeQAHandoffInput = z.object({ workerId: z.string().uuid(), commit: z.string().regex(/^[a-f0-9]{40}$/),
    coordinatorSessionId: z.string().uuid().optional(),
    acknowledgeIncompleteHistory: z.literal(true), setupNote: z.string().trim().min(1).max(2500) }).strict();
