import { z } from 'zod';

const At = z.string().datetime(), Pid = z.number().int().positive().max(2147483647);
export const Errno = z.string().regex(/^[A-Z0-9_]{1,40}$/);
export const Phase = z.enum(['spawn', 'exit', 'close', 'probe', 'term', 'kill', 'settled']);
export const GroupProbe = z.object({ state: z.enum(['alive', 'absent', 'unknown']), errno: Errno.optional() });
export const GroupInventory = z.object({
    status: z.enum(['observed', 'unavailable']), errno: Errno.optional(), truncated: z.boolean(),
    members: z.array(z.object({ pid: Pid, ppid: z.number().int().nonnegative().max(2147483647), pgid: Pid,
        startIdentity: z.string().max(32).regex(/^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{2}:\d{2}:\d{2} \d{4}$/),
        executable: z.string().min(1).max(80).regex(/^[A-Za-z0-9._+-]+$/) })).max(8),
});
/** A closed, bounded schema: no output, arguments, paths, environment or provider response content. */
export const LifecycleDiagnostic = z.object({
    version: z.literal(1), processGroup: Pid, providerTerminalObserved: z.boolean(),
    outcome: z.enum(['completed', 'failed']), failureCategory: z.string().regex(/^[a-z-]{1,40}$/).optional(),
    probeCount: z.number().int().nonnegative(), omittedEvents: z.number().int().nonnegative(),
    events: z.array(z.object({ at: At, phase: Phase, code: z.number().int().nullable().optional(),
        signal: z.string().regex(/^SIG[A-Z0-9]{1,16}$/).nullable().optional(), state: GroupProbe.shape.state.optional(), errno: Errno.optional() })).max(24),
    snapshots: z.array(GroupInventory.extend({ at: At, phase: Phase })).max(5),
});
export type LifecycleDiagnostic = z.infer<typeof LifecycleDiagnostic>;
export type GroupInventory = z.infer<typeof GroupInventory>;
export type GroupProbe = z.infer<typeof GroupProbe>;
export type Phase = z.infer<typeof Phase>;
export const errno = (error: unknown) => Errno.safeParse((error as NodeJS.ErrnoException)?.code).data || 'UNKNOWN';
