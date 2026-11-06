import { z } from 'zod';
import { LESSON_KINDS, LESSON_STAGES, type LessonKind, type LessonStage } from '../../src/contracts/knowledge';

/** Strict structured output for Harper. The model proposes; ids, status and URLs belong to the harness. */
export const RetrospectiveResultSchema = z.object({
    summary: z.string().trim().min(1).max(1500),
    lessons: z.array(z.object({
        statement: z.string().trim().min(1).max(300),
        detail: z.string().max(1500),
        kind: z.enum(LESSON_KINDS as [LessonKind, ...LessonKind[]]),
        stages: z.array(z.enum(LESSON_STAGES as [LessonStage, ...LessonStage[]])).max(6),
        paths: z.array(z.string().max(300)).max(12),
        evidenceIds: z.array(z.string().max(300)).max(5),
    }).strict()).max(5),
}).strict();
export type RetrospectiveResult = z.infer<typeof RetrospectiveResultSchema>;
