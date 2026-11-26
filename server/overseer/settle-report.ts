import type { EffectIntent } from '../../src/contracts/work';
import { RUNNER_PROJECT } from '../incidents/runner-report';
import { sanitize } from '../office/security';
import type { Effects } from '../store/effects';
import type { OfficeWriter } from './office-writer';

/** The runner Store's Effects, as runner-store.ts opens them. Only types are imported, so nothing here loads Office modules. */
export type RunnerEffects = Pick<Effects, 'execute' | 'reconcile'> & { readIntent(id: string): EffectIntent<Record<string, unknown>> | undefined };

/**
 * How one report send ended. `refused`: stopped by its preflight, so nothing was dispatched and a
 * later pass may try under a new attempt. `uncertain`: dispatched, and read-back has not shown it
 * kept; it is only read back from now on, never sent again.
 */
export type Sent<R> =
    | { status: 'verified'; receipt: R }
    | { status: 'refused'; reason: string; cause: 'fenced' | 'unreachable' | 'other' }
    | { status: 'uncertain'; reason: string };

class PreflightRefused extends Error {
    constructor(readonly cause: 'fenced' | 'unreachable', message: string) { super(message); }
}

const bounded = (text: string) => sanitize(text).slice(0, 500);

/** The first attempt number for `prefix` that no intent holds yet. */
export function freeAttempt(effects: RunnerEffects, prefix: string, from = 1): number {
    let attempt = from;
    while (effects.readIntent(`${prefix}:${attempt}`)) attempt += 1;
    return attempt;
}

/**
 * One report through the runner's Effects: the intent is saved, the preflight reads the Office's
 * health and refuses while it cannot be read or a deployment holds its fence, the report is sent
 * once, and an independent read-back must show it kept. What `verify` returns is the receipt, or
 * null while the Office does not show it. Under the rule Joe set in AGENTS.md ("An uncertain
 * effect is reconciled by read-back, never resent"), anything that happens after the dispatch was
 * claimed, a fence refusal included, leaves the report for read-back only.
 */
export async function sendReport<R>(input: {
    effects: RunnerEffects; writer: OfficeWriter; origin: string; id: string; workId: string; operation: string;
    payload: Record<string, unknown>; dispatch: () => Promise<unknown>; verify: () => Promise<R | null>;
}): Promise<Sent<R>> {
    const { effects, writer, id } = input;
    let receipt: R | null = null;
    try {
        await effects.execute({
            id, work: { projectId: RUNNER_PROJECT, kind: 'maintenance', id: input.workId }, attemptId: id, operation: input.operation,
            target: input.origin, authorization: 'overseer runner', payload: input.payload, expectedState: null,
            preflight: async () => {
                let fence: string;
                try { fence = (await writer.health()).fence; }
                catch (error) { throw new PreflightRefused('unreachable', `The Office's health could not be read before sending: ${error instanceof Error ? error.message : String(error)}`); }
                if (fence !== 'open') throw new PreflightRefused('fenced', `The deployment fence is ${fence}; nothing was sent`);
                if (!writer.canStartRequest()) throw new PreflightRefused('unreachable', 'The pass has no time left for the report; nothing was sent');
            },
            dispatch: async () => { await input.dispatch(); return {}; },
            verify: async () => { receipt = await input.verify(); return receipt !== null; },
        });
        // An intent an earlier pass verified returns without a read-back: read it now.
        receipt ??= await input.verify();
        return receipt !== null ? { status: 'verified', receipt } : { status: 'uncertain', reason: 'recorded as sent, and read-back no longer shows it' };
    } catch (error) {
        if (error instanceof PreflightRefused) return { status: 'refused', reason: bounded(error.message), cause: error.cause };
        const intent = effects.readIntent(id);
        // Nothing was claimed for dispatch: an identity or Store problem before sending.
        if (!intent?.dispatchedAt) return { status: 'refused', reason: bounded(error instanceof Error ? error.message : String(error)), cause: 'other' };
        return { status: 'uncertain', reason: bounded(`sent, not yet read back: ${error instanceof Error ? error.message : String(error)}`) };
    }
}

/** Reads back a report already dispatched. True once the Office shows it; the intent is then verified without anything being sent. */
export async function readBackReport(effects: RunnerEffects, id: string, read: () => Promise<boolean>): Promise<boolean> {
    const intent = effects.readIntent(id);
    if (!intent) return false;
    if (intent.status === 'verified') return read();
    let shown = false;
    await effects.reconcile(id, async () => { shown = await read(); return { verified: shown, receipt: {} }; });
    return shown;
}
