import { z } from 'zod';
import { LESSON_KINDS, LESSON_STAGES, type LessonKind, type LessonStage } from '../../src/contracts/knowledge';

const Kind = z.enum(LESSON_KINDS as [LessonKind, ...LessonKind[]]);
const Stage = z.enum(LESSON_STAGES as [LessonStage, ...LessonStage[]]);

/** Strict structured output for Harper. The model proposes; ids, status and URLs belong to the harness. */
export const RetrospectiveResultSchema = z.object({
    summary: z.string().trim().min(1).max(1500),
    lessons: z.array(z.object({
        statement: z.string().trim().min(1).max(300),
        detail: z.string().max(1500),
        kind: Kind,
        stages: z.array(Stage).max(6),
        paths: z.array(z.string().max(300)).max(12),
        evidenceIds: z.array(z.string().max(300)).max(5),
        repositoryInstruction: z.boolean(),
    }).strict()).max(5),
    recurrences: z.array(z.object({ lessonId: z.string().max(100), detail: z.string().max(300) }).strict()).max(10),
}).strict();
export type RetrospectiveResult = z.infer<typeof RetrospectiveResultSchema>;

/** Friday roll-up: a short narrative plus at most three office-wide proposals for Joe. */
export const RollupResultSchema = z.object({
    summary: z.string().trim().min(1).max(2000),
    officeProposals: z.array(z.object({
        statement: z.string().trim().min(1).max(300),
        detail: z.string().max(1500),
        kind: Kind,
        stages: z.array(Stage).max(6),
    }).strict()).max(3),
}).strict();
export type RollupResult = z.infer<typeof RollupResultSchema>;
