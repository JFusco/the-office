import { z } from 'zod';
const sha=z.string().regex(/^[a-f0-9]{40}$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
export const PublishedCaptureNote=z.object({path:z.string().max(500).regex(/^knowledge\/[a-zA-Z0-9_/-]+\.md$/).refine(path=>!path.split('/').includes('..')),commit:sha,contentSha256:hash});
export const BrainCaptureReceipt=z.object({version:z.literal(1),requestId:z.string().uuid(),found:z.boolean(),id:z.string().max(200).optional(),inputSha256:hash.optional(),domain:z.string().max(200).optional(),currentStatus:z.string().max(100).optional(),
    disposition:z.object({as:z.enum(['accepted','rejected','superseded']),at:z.iso.datetime(),pr:z.number().int().positive().max(2147483647).optional(),mergeCommit:sha.optional()}).nullable().optional(),
    lineage:z.enum(['mapped','unknown']).optional(),publications:z.array(PublishedCaptureNote).max(20).optional(),requestIds:z.array(z.string().uuid()).max(100).optional(),nextCursor:z.string().max(200).nullable().optional()});
export type BrainCaptureReceipt=z.infer<typeof BrainCaptureReceipt>;
