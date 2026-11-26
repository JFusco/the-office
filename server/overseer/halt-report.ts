import { canonical } from '../incidents/canonical-json';
import { haltCondition, type HaltReport } from '../incidents/runner-report';
import { sanitize } from '../office/security';
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
    const { origin, state, effects, writer } = input, wanted = readControlCondition(input.paths);
    state.prepareHalt();
    const halt = state.halt(origin), goal = haltCondition(wanted);
    const summary = (detail: string | null = null, pending = condition(halt.pending)): HaltSummary =>
        ({ confirmed: condition(halt.confirmed), pending, conflict: halt.conflict, detail: detail === null ? null : sanitize(detail).slice(0, 500) });
    let office: HaltReport | null;
    try {
        const answer = await writer.readHalt();
        office = answer.result === 'present' ? answer.report : null;
    } catch (error) {
        const confirmed = halt.confirmed && haltCondition(halt.confirmed) === goal;
        return summary(`The runner's halt could not be read back: ${error instanceof Error ? error.message : String(error)}`, confirmed && !halt.pending ? null : wanted);
    }
    if (office) halt.highWater = Math.max(halt.highWater, office.sequence);

    const dispatched = (target: string, report: HaltReport, attempt: number) => {
        const intent = effects.readIntent(haltIntent(report.sequence, attempt));
        return intent?.target === target && !!intent.dispatchedAt && intent.status !== 'verified';
    };
    const displace = () => {
        if (halt.pending && dispatched(origin, halt.pending, halt.attempt))
            (halt.displaced ??= []).push({ report: halt.pending, attempt: halt.attempt });
        halt.pending = null;
    };
    const settleDisplaced = async (observed: HaltReport) => {
        const outstanding: NonNullable<HaltState['displaced']> = [];
        for (const entry of halt.displaced ?? []) {
            const { report, attempt } = entry, id = haltIntent(report.sequence, attempt);
            if (observed.sequence > report.sequence)
                await effects.reconcile(id, async () => ({ verified: true, receipt: { result: 'superseded', sequence: observed.sequence } }));
            else if (same(observed, report)) await readBackReport(effects, id, async () => true);
            else outstanding.push(entry);
        }
        halt.displaced = outstanding;
    };

    // Settle what an earlier pass sent. A conflict found now stays in this pass's summary, whatever is sent after it.
    let conflictedNow = false;
    if (halt.pending && office && office.sequence >= halt.pending.sequence) {
        const pending = halt.pending;
        if (office.sequence > pending.sequence) { displace(); halt.confirmed = null; }
        else if (same(office, pending)) {
            if (dispatched(origin, pending, halt.attempt))
                await readBackReport(effects, haltIntent(pending.sequence, halt.attempt), async () => true);
            halt.confirmed = pending; halt.pending = null; halt.conflict = null;
        } else { halt.conflict = `The Office holds sequence ${office.sequence} with other content`; displace(); conflictedNow = true; }
    }
    if (office) await settleDisplaced(office);

    // Loopback names can point to the same slot. A different condition could still arrive
    // through another origin, but only that origin's read-back can settle its Effect.
    let competing = 0;
    for (const saved of [{ origin, halt }, ...state.otherHalts(origin)]) {
        const reports = [...(saved.halt.displaced ?? [])];
        if (saved.halt.pending) reports.push({ report: saved.halt.pending, attempt: saved.halt.attempt });
        for (const { report, attempt } of reports) {
            if (haltCondition(report) !== goal && dispatched(saved.origin, report, attempt))
                competing = Math.max(competing, report.sequence);
        }
    }
    if (!halt.pending && office && office.sequence > competing && haltCondition(office) === goal) {
        halt.confirmed = office;
        if (!conflictedNow) halt.conflict = null;
        state.saveHalt(origin, halt);
        return summary();
    }
    if (!halt.pending || haltCondition(halt.pending) !== goal || halt.pending.sequence <= competing) {
        displace();
        halt.highWater = Math.max(halt.highWater, competing);
        const sequence = halt.highWater + 1;
        halt.pending = { version: 1, sequence, ...wanted, pass: input.pass, reportedAt: input.now().toISOString() };
        halt.highWater = sequence;
        halt.attempt = freeAttempt(effects, `halt:${sequence}`);
    }
    state.saveHalt(origin, halt);

    const pending = halt.pending, id = haltIntent(pending.sequence, halt.attempt), intent = effects.readIntent(id);
    // Sent before and not yet shown: read back only.
    if (intent?.target === origin && intent.dispatchedAt) return summary('The halt report was sent and the Office does not show it yet');
    if (intent && (intent.target !== origin || intent.status === 'rejected')) {
        halt.attempt = freeAttempt(effects, `halt:${pending.sequence}`, halt.attempt + 1);
        state.saveHalt(origin, halt);
    }
    let observed: HaltReport | null = null;
    const sent = await sendReport<HaltReport>({
        effects, writer, origin, id: haltIntent(pending.sequence, halt.attempt), workId: `halt:${pending.sequence}`, operation: 'overseer-halt',
        payload: { sequence: pending.sequence, condition: haltCondition(pending) },
        dispatch: () => writer.sendHalt(pending),
        verify: async () => {
            const answer = await writer.readHalt();
            observed = answer.result === 'present' ? answer.report : null;
            return observed && same(observed, pending) ? observed : null;
        },
    });
    if (sent.status === 'verified') { halt.confirmed = pending; halt.pending = null; if (!conflictedNow) halt.conflict = null; }
    const finalRead = observed as HaltReport | null;
    if (finalRead && finalRead.sequence > pending.sequence) {
        displace();
        halt.highWater = Math.max(halt.highWater, finalRead.sequence);
        halt.confirmed = null;
    }
    if (finalRead) await settleDisplaced(finalRead);
    state.saveHalt(origin, halt);
    return summary(sent.status === 'verified' ? null : sent.reason);
}
