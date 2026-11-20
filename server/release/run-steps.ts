import type { Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { readDeployJournal, recordDeployStep } from './deploy-journal';

export type StepResult =
    | { state: 'done'; receipt?: Record<string, unknown> }
    | { state: 'failed' | 'uncertain'; reason: string; receipt?: Record<string, unknown> };
export type StepFunction = (receipts: Record<string, Record<string, unknown>>) => Promise<StepResult>;

export type StepsOutcome =
    | { completed: true; receipts: Record<string, Record<string, unknown>> }
    | { completed: false; step: string; state: 'failed' | 'uncertain'; reason: string; receipt: Record<string, unknown> };

export const stepOf = (settled: Settled): StepResult => settled.status === 'verified' ? { state: 'done', receipt: settled.receipt }
    : { state: settled.status === 'rejected' ? 'failed' : 'uncertain', reason: settled.reason };

/**
 * Runs a journaled operation from wherever its journal stands. A step is recorded `intended` before
 * it runs and settled after; a step found `intended` is run again without a second intent, which is
 * safe because every mutation settles by read-back. A journal that already ended in `failed` or
 * `uncertain`, or ends in a cut-short line, runs nothing. A step that throws has an unknown outcome.
 */
export async function runSteps(ctx: Pick<DeployContext, 'dataRoot' | 'now' | 'observe'>, operation: string, steps: Record<string, StepFunction>): Promise<StepsOutcome> {
    let view = readDeployJournal(ctx.dataRoot, operation);
    if (view.torn) return { completed: false, step: view.last?.step ?? view.steps[0], state: 'uncertain', reason: 'the journal ends in a cut-short line; its last step is unknown', receipt: {} };
    if (view.last && view.last.state !== 'done' && view.last.state !== 'intended') {
        const receipt = view.last.receipt ?? {};
        return { completed: false, step: view.last.step, state: view.last.state, reason: String(receipt.reason ?? `step ${view.last.step} ended ${view.last.state}`), receipt };
    }
    let index = view.last ? view.steps.indexOf(view.last.step) + (view.last.state === 'done' ? 1 : 0) : 0;
    for (; index < view.steps.length; index++) {
        const step = view.steps[index];
        if (!(view.last?.step === step && view.last.state === 'intended')) view = recordDeployStep(ctx.dataRoot, operation, step, 'intended', undefined, ctx.now);
        ctx.observe?.({ operation, step, phase: 'intended' });
        let result: StepResult;
        try { result = await steps[step](view.receipts); }
        catch (error) { result = { state: 'uncertain', reason: `step ${step} ended without a known outcome: ${String(error).slice(0, 500)}` }; }
        ctx.observe?.({ operation, step, phase: 'ran', state: result.state });
        const receipt = result.state === 'done' ? result.receipt : { ...result.receipt, reason: result.reason };
        view = recordDeployStep(ctx.dataRoot, operation, step, result.state, receipt, ctx.now);
        ctx.observe?.({ operation, step, phase: 'recorded', state: result.state });
        if (result.state !== 'done') return { completed: false, step, state: result.state, reason: result.reason, receipt: receipt ?? {} };
    }
    return { completed: true, receipts: view.receipts };
}
