import { canonical } from '../incidents/canonical-json';
import { haltCondition, type HaltReport } from '../incidents/runner-report';
import type { RunnerPaths } from './config';
import type { ForwardingState, HaltState } from './forwarding-state';
import { readControlCondition, type ControlCondition } from './kill-switch';
import type { OfficeWriter } from './office-writer';
import { freeAttempt, readBackReport, sendReport, type RunnerEffects } from './settle-report';

export interface HaltSummary {
    /** The condition the Office was last read back holding as this runner sent it. */
    confirmed: ControlCondition | null;
    /** A condition sent or about to be, not yet confirmed. */
    pending: ControlCondition | null;
    conflict: string | null;
    /** Why reporting did not finish, if it did not. */
    detail: string | null;
}

export const haltIntent = (sequence: number, attempt: number) => `halt:${sequence}:${attempt}`;
const condition = (report: HaltReport | null): ControlCondition | null => report && { kind: report.kind, control: report.control, reason: report.reason, since: report.since };
const same = (a: HaltReport, b: HaltReport) => canonical(a) === canonical(b);

/**
 * Tells the Office the runner's control condition as the pass ends: running, paused or stopped.
 * It runs after the pass has had its chance to write STOP, on every recorded pass.
 *
 * The Office keeps one report and orders reports by sequence. Each new condition gets a sequence
 * above everything this runner used and everything the Office was seen holding, and the report is
 * frozen in the Store before it is sent, so a restart sends the same one. The Office holding that
 * sequence with that content confirms it; a higher sequence there supersedes it; the same sequence
 * with other content is a conflict. While a different report of this runner could still land, a
 * changed condition is published at a higher sequence even if the Office already shows it, so a
 * clear always overtakes a STOP that was delayed.
 */
export async function reportHalt(input: {
    paths: RunnerPaths; origin: string; state: ForwardingState; effects: RunnerEffects; writer: OfficeWriter; pass: string; now: () => Date;
}): Promise<HaltSummary> {
    const { origin, state, effects, writer } = input, wanted = readControlCondition(input.paths), halt: HaltState = state.halt(origin);
    const summary = (detail: string | null = null): HaltSummary => ({ confirmed: condition(halt.confirmed), pending: condition(halt.pending), conflict: halt.conflict, detail });
    let office: HaltReport | null;
    try {
        const answer = await writer.readHalt();
        office = answer.result === 'present' ? answer.report : null;
    } catch (error) { return summary(`The runner's halt could not be read back: ${error instanceof Error ? error.message : String(error)}`); }
    if (office) halt.highWater = Math.max(halt.highWater, office.sequence);

    // Settle what an earlier pass sent. A conflict found now stays in this pass's summary, whatever is sent after it.
    let conflictedNow = false;
    if (halt.pending && office && office.sequence >= halt.pending.sequence) {
        const pending = halt.pending;
        if (office.sequence > pending.sequence) { halt.pending = null; halt.confirmed = null; }
        else if (same(office, pending)) {
            if (effects.readIntent(haltIntent(pending.sequence, halt.attempt))?.dispatchedAt) await readBackReport(effects, haltIntent(pending.sequence, halt.attempt), async () => true);
            halt.confirmed = pending; halt.pending = null; halt.conflict = null;
        } else { halt.conflict = `The Office holds sequence ${office.sequence} with other content`; halt.pending = null; conflictedNow = true; }
    }
    const goal = haltCondition(wanted);
    if (!halt.pending) {
        // Nothing of this runner's is still in flight: the Office's own report can stand for the condition.
        if (office && haltCondition(office) === goal) { halt.confirmed = office; if (!conflictedNow) halt.conflict = null; state.saveHalt(origin, halt); return summary(); }
    }
    if (!halt.pending || haltCondition(halt.pending) !== goal) {
        const sequence = halt.highWater + 1;
        halt.pending = { version: 1, sequence, ...wanted, pass: input.pass, reportedAt: input.now().toISOString() };
        halt.highWater = sequence;
        halt.attempt = freeAttempt(effects, `halt:${sequence}`);
    }
    state.saveHalt(origin, halt);

    const pending = halt.pending, id = haltIntent(pending.sequence, halt.attempt), intent = effects.readIntent(id);
    // Sent before and not yet shown: read back only.
    if (intent?.dispatchedAt) { state.saveHalt(origin, halt); return summary('The halt report was sent and the Office does not show it yet'); }
    if (intent?.status === 'rejected') { halt.attempt = freeAttempt(effects, `halt:${pending.sequence}`, halt.attempt + 1); state.saveHalt(origin, halt); }
    const sent = await sendReport<HaltReport>({
        effects, writer, origin, id: haltIntent(pending.sequence, halt.attempt), workId: `halt:${pending.sequence}`, operation: 'overseer-halt',
        payload: { sequence: pending.sequence, condition: haltCondition(pending) },
        dispatch: () => writer.sendHalt(pending),
        verify: async () => { const answer = await writer.readHalt(); return answer.result === 'present' && same(answer.report, pending) ? answer.report : null; },
    });
    if (sent.status === 'verified') { halt.confirmed = pending; halt.pending = null; if (!conflictedNow) halt.conflict = null; }
    state.saveHalt(origin, halt);
    return summary(sent.status === 'verified' ? null : sent.reason);
}
