import { z } from 'zod';

/**
 * What a triage stage returns about one incident (version 1): one of five verdicts, each strict and
 * bounded, with the evidence it rests on. A verdict is a proposal; only corroboration can turn two of
 * them into an outcome, and nothing here grants authority.
 */

export const TRIAGE_VERDICTS = ['harness-defect', 'real-block', 'false-positive', 'stale-state', 'needs-joe'] as const;
export type TriageVerdict = typeof TRIAGE_VERDICTS[number];

const hash = z.string().regex(/^[0-9a-f]{64}$/, 'a lowercase SHA-256');
/** Repository-relative: no leading slash, no `..` or `.` segment, no backslash or control character. */
const repositoryPath = z.string().min(1).max(300).refine(path => !path.startsWith('/') && !/[\\\0-\x1f]/.test(path)
    && path.split('/').every(part => part !== '' && part !== '.' && part !== '..'), 'a repository-relative path');
const line = z.number().int().min(1).max(1_000_000);
const text = (max: number) => z.string().max(max).refine(value => value.trim().length > 0, 'not blank');
/** Elements unique by their JSON. */
const uniqueList = <T extends z.ZodType>(item: T, min: number, max: number) => z.array(item).min(min).max(max)
    .refine(list => new Set(list.map(entry => JSON.stringify(entry))).size === list.length, 'unique entries');

export const FileReferenceSchema = z.strictObject({ path: repositoryPath, sha256: hash });
/** One-based inclusive lines of one version of a file, the line the claim turns on, and the SHA-256 of the lines joined with LF. */
export const SourceRangeSchema = z.strictObject({ path: repositoryPath, sha256: hash, startLine: line, endLine: line, decisiveLine: line, excerptSha256: hash })
    .refine(range => range.startLine <= range.decisiveLine && range.decisiveLine <= range.endLine, 'start <= decisive <= end');
export const SubjectReferenceSchema = z.strictObject({ kind: z.literal('subject'), key: z.string().min(1).max(400), stopDigest: hash });
export const EventReferenceSchema = z.strictObject({ kind: z.literal('event'), id: z.string().min(1).max(200) });
const ReferenceSchema = z.discriminatedUnion('kind', [SubjectReferenceSchema, EventReferenceSchema]);
/** The packet carries at most 50 subjects and 30 recent events. */
const references = uniqueList(ReferenceSchema, 1, 80);

/** Whether the work is allowed or refused, and the cause the harness gives for it. */
export const DispositionSchema = z.strictObject({ outcome: z.enum(['allow', 'refuse']), cause: text(200) });
export const CorrectionCaseSchema = z.strictObject({
    /** The open episodes the correction covers. */
    episodes: uniqueList(SubjectReferenceSchema, 1, 50),
    trigger: z.strictObject({
        /** The versioned clause or test example the condition comes from. */
        clause: SourceRangeSchema,
        facts: uniqueList(z.strictObject({ name: text(100), value: text(300) }), 1, 20),
        /** An unconditional rule, or an exception that holds only under `condition`. */
        scope: z.enum(['unconditional', 'conditional']),
        condition: text(500).nullable(),
    }),
    observed: DispositionSchema,
    required: DispositionSchema,
});

const common = {
    version: z.literal(1),
    confidence: z.enum(['low', 'medium', 'high']),
    references,
    causalExplanation: text(4000),
    /** An authority the correction would need that is not established: a decision for Joe, a missing approval. */
    authorityPrerequisite: text(500).nullable(),
};
/** Fields only a repair has, present and empty on every other verdict. */
const noRepair = { invariant: z.null(), correction: z.null(), affectedFiles: z.array(FileReferenceSchema).max(0), regression: z.null() };

const HarnessDefect = z.strictObject({
    ...common,
    verdict: z.literal('harness-defect'),
    refusalSite: SourceRangeSchema,
    invariant: z.strictObject({ statement: text(1000), requirement: SourceRangeSchema }),
    correction: z.strictObject({
        direction: z.enum(['refuse-less', 'refuse-more', 'refuse-differently', 'no-refusal-change']),
        site: SourceRangeSchema,
        editPaths: uniqueList(FileReferenceSchema, 1, 15),
        explanation: text(2000),
        case: CorrectionCaseSchema,
    }),
    affectedFiles: uniqueList(FileReferenceSchema, 1, 15),
    /** Asserts the correction case's trigger and required disposition, in an existing versioned test file. */
    regression: z.strictObject({ target: FileReferenceSchema, description: text(1000) }),
});
const RealBlock = z.strictObject({ ...common, ...noRepair, verdict: z.literal('real-block'), stop: SubjectReferenceSchema, refusalSite: SourceRangeSchema, rule: SourceRangeSchema });
const FalsePositive = z.strictObject({ ...common, ...noRepair, verdict: z.literal('false-positive'), refusalSite: z.null(), stops: uniqueList(SubjectReferenceSchema, 1, 50), reason: text(1000), citation: SourceRangeSchema });
const StaleState = z.strictObject({ ...common, ...noRepair, verdict: z.literal('stale-state'), refusalSite: z.null(), change: references });
const NeedsJoe = z.strictObject({ ...common, ...noRepair, verdict: z.literal('needs-joe'), refusalSite: z.null(), question: text(1000) });

const sameFile = (a: { path: string; sha256: string }, b: { path: string; sha256: string }) => a.path === b.path && a.sha256 === b.sha256;

export const TriageResultSchema = z.discriminatedUnion('verdict', [HarnessDefect, RealBlock, FalsePositive, StaleState, NeedsJoe]).superRefine((result, context) => {
    if (result.verdict !== 'harness-defect') return;
    const { correction, affectedFiles } = result;
    if (!correction.editPaths.some(file => sameFile(file, correction.site)))
        context.addIssue({ code: 'custom', path: ['correction', 'editPaths'], message: 'the correction site must be among its edit paths' });
    if (!correction.editPaths.every(file => affectedFiles.some(affected => sameFile(affected, file))))
        context.addIssue({ code: 'custom', path: ['affectedFiles'], message: 'every edit path must be an affected file' });
    if ((correction.case.trigger.scope === 'conditional') !== (correction.case.trigger.condition !== null))
        context.addIssue({ code: 'custom', path: ['correction', 'case', 'trigger', 'condition'], message: 'a conditional exception names its condition, an unconditional rule none' });
});
export type TriageResult = z.infer<typeof TriageResultSchema>;
export type HarnessDefectResult = Extract<TriageResult, { verdict: 'harness-defect' }>;
export type SourceRange = z.infer<typeof SourceRangeSchema>;
export type FileReference = z.infer<typeof FileReferenceSchema>;
export type SubjectReference = z.infer<typeof SubjectReferenceSchema>;
export type CorrectionCase = z.infer<typeof CorrectionCaseSchema>;
