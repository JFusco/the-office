import { freezeLearningPacket } from './learning-packet';
import { recordTrigger } from './record-trigger';
import { appendLearningFacts } from './learning-facts';
import { learningDigest } from './learning-events';
import { easternDay } from '../office/clock';
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
import { RetrospectiveResultSchema } from './retrospective-result';
import { findSubject } from './retrospective-subject';
import { terminalCandidates, triggerJobId } from './retrospective-triggers';

export const RETROSPECTIVE_TIMEOUT = 20 * 60 * 1000;
const FIRST_DELAY = 5 * 60 * 1000, MAX_DELAY = 6 * 60 * 60 * 1000;
/** Capped exponential backoff; each batch has at most five total attempts. */
export const retryDelay = (attempts: number) => Math.min(MAX_DELAY, FIRST_DELAY * 2 ** Math.max(0, attempts - 1));

export interface KnowledgeRunOptions { readOnly: true; effortKind: 'administrative'; stage: 'retrospective' | 'knowledge-rollup' | 'knowledge-research'; requestId: string; ticket: string; cwd: string; enqueuedAt: string; timeout: number }
/** Harper's model call, injected so tests never reach a provider. */
export type KnowledgeRunner = <T>(prompt: string, schema: z.ZodType<T>, opts: KnowledgeRunOptions) => Promise<T>;
/** @deprecated name kept for slice 1 callers. */
export type RetrospectiveRunner = KnowledgeRunner;

/** Harper works outside every repository, so session inventory never mistakes Harper for a ticket owner. */
export function harperFolder(store: Store, name: string): string {
    const cwd = resolve(store.dataRoot, 'retrospectives', name);
    mkdirSync(cwd, { recursive: true, mode: 0o700 });
    return cwd;
}

/** Runs one retrospective. Any failure keeps the occurrence pending with a later retry time.
 * Administrative effort: Harper's time never adds to a ticket's published hours. */
export async function runRetrospective(store: Store, run: KnowledgeRunner, id: string): Promise<void> {
    const knowledge = store.state.knowledge;
    if (!knowledge || !knowledge.enabled || store.state.paused || store.state.draining || knowledge.consumed.includes(id)) return;
    let pending = knowledge.pending.find(entry => entry.id === id);
    if (!pending) {
        const candidate = terminalCandidates(knowledge, store.state.coordination?.jobs || [], store.state.tickets, store.state.maintenance?.runs || []).find(entry => entry.id === id);
        if (!candidate) return;
        recordTrigger(store, { id, at: candidate.at, jobId: candidate.subjectId, key: candidate.key, trigger: candidate.trigger, subject: candidate.subject, event: { stage: candidate.stage, head: candidate.head, steps: candidate.steps, reason: candidate.reason } });
        pending = knowledge.pending.find(entry => entry.id === id);
        store.save();
        if (!pending) return;
    }
    const subject = findSubject(store, id);
    const started = store.clock.now();
    if (!subject) {
        acceptRetrospective(store, pending, { catalog: {} }, { summary: 'The job is no longer retained; nothing to review.', lessons: [] }, currentAssignment()?.claim.id || randomUUID());
        return;
    }
    const day = easternDay(started);
    const daily = knowledge.learningAttempts ??= {};
    if ((daily[day] || 0) >= 8) return;
    if (pending.attempts >= 5) { acceptRetrospective(store, pending, { catalog: {} }, { summary: 'Learning unavailable after five attempts.', lessons: [] }, randomUUID()); return; }
    daily[day] = (daily[day] || 0) + 1;
    pending.frozen = true;
    pending.attempts++;
    // Provisional deadline before awaiting: a crash mid-run still waits instead of relaunching at once.
    pending.nextAt = new Date(started.getTime() + RETROSPECTIVE_TIMEOUT + retryDelay(pending.attempts)).toISOString();
    pending.lastError = '';
    store.save();
    const attempts = pending.attempts;
    try {
        const folder = harperFolder(store, learningDigest(id));
        const packet = freezeLearningPacket(store, pending, folder, () => appendLearningFacts(retrospectiveFacts(store, subject, pending!), pending!));
        const result = RetrospectiveResultSchema.parse(await run(retrospectivePrompt(packet, store.project.repo), RetrospectiveResultSchema, { readOnly: true, effortKind: 'administrative', stage: 'retrospective', requestId: id, ticket: subject.key, cwd: harperFolder(store, learningDigest(id)), enqueuedAt: pending.createdAt, timeout: RETROSPECTIVE_TIMEOUT }));
        acceptRetrospective(store, pending, packet, result, currentAssignment()?.claim.id || randomUUID());
    }
    catch (error) {
        // A rolled-back transaction replaces state objects; update whatever entry is current now.
        const current: PendingRetrospective | undefined = store.state.knowledge?.pending.find(entry => entry.id === id);
        if (current) {
            current.lastError = String(error instanceof Error ? error.message : error).slice(0, 500);
            current.nextAt = new Date(store.clock.now().getTime() + retryDelay(attempts)).toISOString();
            if (attempts >= 5) acceptRetrospective(store, current, { catalog: {} }, { summary: `Learning unavailable after five attempts: ${current.lastError}`, lessons: [] }, randomUUID());
            else store.save();
        }
    }
}
