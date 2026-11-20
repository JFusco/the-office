import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';
import { resolve } from 'node:path';
import { z } from 'zod';

const Id = z.string().regex(/^[a-z0-9][a-z0-9-]{7,63}$/);
const Step = z.string().regex(/^[a-z][a-z0-9-]{1,63}$/);

const Header = z.object({
    type: z.literal('operation'), operation: Id, at: z.iso.datetime(),
    steps: z.array(Step).min(1).refine(steps => new Set(steps).size === steps.length, 'steps repeat'),
    /** Free-form facts fixed when the deployment starts: controller pin, source and target release, prior plist. */
    facts: z.record(z.string(), z.unknown()),
}).strict();
const Entry = z.object({
    type: z.literal('step'), operation: Id, at: z.iso.datetime(), step: Step,
    state: z.enum(['intended', 'done', 'uncertain', 'failed']),
    receipt: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type DeployStepState = z.infer<typeof Entry>['state'];
export interface DeployJournalView {
    operation: string; steps: string[]; facts: Record<string, unknown>;
    /** Receipts of the steps recorded `done`, by step, for a restarted controller and for a later rollback decision. */
    receipts: Record<string, Record<string, unknown>>;
    /** The newest step entry, or null before the first step. */
    last: { step: string; state: DeployStepState; at: string; receipt?: Record<string, unknown> } | null;
    /** True when the final line was cut short: the step it recorded is unknown and nothing more may be appended. */
    torn: boolean;
}

export const deployJournalPath = (dataRoot: string, operation: string) => resolve(dataRoot, 'deployments', `${Id.parse(operation)}.jsonl`);

function synced(path: string, flag: 'ax' | 'a' | 'r', write?: Buffer): void {
    const fd = openSync(path, flag, 0o600);
    try {
        if (write && writeSync(fd, write) !== write.length) throw new Error(`A journal entry was cut short writing ${path}`);
        fsyncSync(fd);
    } finally { closeSync(fd); }
}

/** Serialised before the file is opened, so an entry that cannot be written never creates or extends a journal. */
function append(path: string, flag: 'ax' | 'a', line: unknown): void {
    const bytes = Buffer.from(`${JSON.stringify(line)}\n`);
    synced(path, flag, bytes);
    if (flag === 'ax') synced(dirname(path), 'r');
}

/** Starts a deployment's journal. Refused when that operation already has one. */
export function startDeployJournal(dataRoot: string, operation: string, steps: string[], facts: Record<string, unknown>, now: () => Date = () => new Date()): DeployJournalView {
    const path = deployJournalPath(dataRoot, operation);
    mkdirSync(dirname(path), { recursive: true });
    synced(resolve(dataRoot), 'r');
    append(path, 'ax', Header.parse({ type: 'operation', operation, at: now().toISOString(), steps, facts }));
    return readDeployJournal(dataRoot, operation);
}

/** What a restarted controller reads before deciding anything: the plan and the last step it recorded. */
export function readDeployJournal(dataRoot: string, operation: string): DeployJournalView {
    const path = deployJournalPath(dataRoot, operation);
    if (!existsSync(path)) throw new Error(`Deployment ${operation} has no journal`);
    const text = readFileSync(path, 'utf8'), torn = !text.endsWith('\n'), lines = text.split('\n');
    lines.pop();
    if (!lines.length) throw new Error(`The journal of deployment ${operation} has no complete header`);
    const header = Header.parse(JSON.parse(lines[0]));
    if (header.operation !== operation) throw new Error(`The journal of deployment ${operation} names ${header.operation}`);
    const view: DeployJournalView = { operation, steps: header.steps, facts: header.facts, receipts: {}, last: null, torn };
    for (const line of lines.slice(1)) {
        const entry = Entry.parse(JSON.parse(line));
        assertNext(view, entry.operation, entry.step, entry.state);
        view.last = { step: entry.step, state: entry.state, at: entry.at, ...(entry.receipt ? { receipt: entry.receipt } : {}) };
        if (entry.state === 'done') view.receipts[entry.step] = entry.receipt ?? {};
    }
    return view;
}

/** A step is intended only after the one before it is done, and settled only after it was intended. */
function assertNext(view: DeployJournalView, operation: string, step: string, state: DeployStepState): void {
    if (operation !== view.operation) throw new Error(`Step ${step} belongs to deployment ${operation}, not ${view.operation}`);
    const index = view.steps.indexOf(step);
    if (index < 0) throw new Error(`Step ${step} is not part of deployment ${view.operation}`);
    const { last } = view;
    if (state === 'intended') {
        const expected = last ? view.steps[view.steps.indexOf(last.step) + 1] : view.steps[0];
        if (last && last.state !== 'done') throw new Error(`Step ${last.step} is ${last.state}; ${step} cannot start`);
        if (step !== expected) throw new Error(`Step ${step} is out of order; ${expected ?? 'nothing'} is next`);
    } else if (!last || last.step !== step || last.state !== 'intended') {
        throw new Error(`Step ${step} cannot be ${state}: it is not the intended step`);
    }
}

/**
 * Appends one step entry, synced to disk and read back before returning. Record `intended` before a
 * mutation and its outcome after. An `uncertain` or `failed` step ends the journal, so nothing is resent
 * from it; an abort or rollback after one is a new operation with its own journal.
 */
export function recordDeployStep(dataRoot: string, operation: string, step: string, state: DeployStepState, receipt?: Record<string, unknown>, now: () => Date = () => new Date()): DeployJournalView {
    const view = readDeployJournal(dataRoot, operation);
    if (view.torn) throw new Error(`The journal of deployment ${operation} ends in a cut-short line; its last step is unknown`);
    assertNext(view, operation, step, state);
    append(deployJournalPath(dataRoot, operation), 'a', Entry.parse({ type: 'step', operation, at: now().toISOString(), step, state, ...(receipt ? { receipt } : {}) }));
    const saved = readDeployJournal(dataRoot, operation);
    if (saved.torn || saved.last?.step !== step || saved.last.state !== state) throw new Error(`Step ${step} was not saved as ${state} in the journal of deployment ${operation}`);
    return saved;
}
