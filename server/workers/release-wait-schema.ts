import { z } from 'zod';

/** A provider-wait on a published npm release, stated so the harness can check it: the lowest stable x.y.z that satisfies the wait. */
export const ReleaseWaitSchema = z.object({
    registry: z.literal('npm'),
    package: z.string().regex(/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/),
    minimum: z.string().regex(/^\d+\.\d+\.\d+$/),
}).strict();
