import type { DeployContext } from './deploy-context';

/** Polls until `done` answers or the deadline passes; the last answer is returned either way. */
export async function until<T>(ctx: Pick<DeployContext, 'now' | 'sleep' | 'timings'>, deadlineMs: number, read: () => Promise<T>, done: (value: T) => boolean): Promise<T> {
    const started = ctx.now().getTime();
    for (;;) {
        const value = await read();
        if (done(value) || ctx.now().getTime() - started >= deadlineMs) return value;
        await ctx.sleep(ctx.timings.pollMs);
    }
}
