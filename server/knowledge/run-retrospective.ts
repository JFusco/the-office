import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { z } from 'zod';
import type { PendingRetrospective } from '../../src/shared';
import type { Store } from '../store/store';
import { currentAssignment } from '../workers/assignment-context';
import { acceptRetrospective } from './accept-retrospective';
import { retrospectiveFacts } from './retrospective-facts';
import { retrospectivePrompt } from './retrospective-prompt';
import { RetrospectiveResultSchema, type RetrospectiveResult } from './retrospective-result';
import { terminalCandidates, triggerJobId } from './retrospective-triggers';

export const RETROSPECTIVE_TIMEOUT = 20 * 60 * 1000;
const FIRST_DELAY = 5 * 60 * 1000, MAX_DELAY = 6 * 60 * 60 * 1000;
/** Capped exponential backoff with no exhaustion: a failed retrospective simply tries again later. */
export const retryDelay = (attempts: number) => Math.min(MAX_DELAY, FIRST_DELAY * 2 ** Math.max(0, attempts - 1));

export type RetrospectiveRunner = (prompt: string, schema: z.ZodType<RetrospectiveResult>, opts: { readOnly: true; effortKind: 'administrative'; stage: 'retrospective'; requestId: string; ticket: string; cwd: string; enqueuedAt: string; timeout: number }) => Promise<RetrospectiveResult>;

/** Runs one retrospective. Any failure keeps the occurrence pending with a later retry time.
 * Administrative effort: Harper's time never adds to a ticket's published hours. */
export async function runRetrospective(store: Store, run: RetrospectiveRunner, id: string): Promise<void> {
    const knowledge = store.state.knowledge;
    if (!knowledge || knowledge.consumed.includes(id)) return;
    const jobs = store.state.coordination?.jobs || [];
    let pending = knowledge.pending.find(entry => entry.id === id);
    if (!pending) {
        const candidate = terminalCandidates(knowledge, jobs).find(entry => entry.id === id);
        if (!candidate) return;
        pending = { id, jobId: candidate.job.id, key: candidate.job.key, trigger: candidate.trigger, createdAt: store.clock.now().toISOString(), event: { stage: candidate.job.stage, head: candidate.job.mergeCommit || candidate.job.head, steps: candidate.job.steps.length, reason: candidate.job.detail.slice(0, 500) }, attempts: 0, nextAt: '', lastError: '' };
        knowledge.pending.push(pending);
    }
    const job = jobs.find(entry => entry.id === triggerJobId(id));
    const started = store.clock.now();
    if (!job) {
        acceptRetrospective(store, pending, { catalog: {} }, { summary: 'The job is no longer retained; nothing to review.', lessons: [] }, currentAssignment()?.claim.id || randomUUID());
        return;
    }
    pending.attempts++;
    // Provisional deadline before awaiting: a crash mid-run still waits instead of relaunching at once.
    pending.nextAt = new Date(started.getTime() + RETROSPECTIVE_TIMEOUT + retryDelay(pending.attempts)).toISOString();
    pending.lastError = '';
    store.save();
    const attempts = pending.attempts;
    try {
        const packet = retrospectiveFacts(store, job, pending);
        // Outside the repository, so session inventory never mistakes Harper for an owner of the ticket.
        const cwd = resolve(store.dataRoot, 'retrospectives', job.id);
        mkdirSync(cwd, { recursive: true, mode: 0o700 });
        const result = RetrospectiveResultSchema.parse(await run(retrospectivePrompt(packet, store.project.repo), RetrospectiveResultSchema, { readOnly: true, effortKind: 'administrative', stage: 'retrospective', requestId: id, ticket: job.key, cwd, enqueuedAt: pending.createdAt, timeout: RETROSPECTIVE_TIMEOUT }));
        acceptRetrospective(store, pending, packet, result, currentAssignment()?.claim.id || randomUUID());
    }
    catch (error) {
        // A rolled-back transaction replaces state objects; update whatever entry is current now.
        const current: PendingRetrospective | undefined = store.state.knowledge?.pending.find(entry => entry.id === id);
        if (current) {
            current.lastError = String(error instanceof Error ? error.message : error).slice(0, 500);
            current.nextAt = new Date(store.clock.now().getTime() + retryDelay(attempts)).toISOString();
            store.save();
        }
    }
}
