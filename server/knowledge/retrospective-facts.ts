import type { LessonEvidence, PendingRetrospective, TicketJob } from '../../src/shared';
import type { Store } from '../store/store';

/** Initial engineering defaults, not measured optima. Mirrors the clipping in leadership/fact-bounds.ts. */
export const PACKET_LIMIT = 24000;
const TEXT = 1500, SHORT = 300, ENTRIES = 20;
const clip = (text: unknown, limit = TEXT) => { const value = typeof text === 'string' ? text : text == null ? '' : String(text); return value.length <= limit ? value : `${value.slice(0, limit)}…`; };

export interface RetrospectivePacket {
    trigger: { id: string; kind: PendingRetrospective['trigger']; event: PendingRetrospective['event'] };
    job: { id: string; key: string; status: string; stage: string; issueUrl: string; pr: number; prUrl: string; head: string; detail: string; approach: unknown };
    steps: unknown[];
    decisions: unknown[];
    ciRepairs: unknown[];
    timing: unknown[];
    conversation: unknown[];
    notes: unknown[];
    activeLessons: { id: string; statement: string }[];
    omitted: Record<string, number>;
    /** Harness-owned evidence references. The model cites refs; URLs are never model-supplied. */
    catalog: Record<string, LessonEvidence>;
}

/** Bounded, read-only facts about one finished job, frozen for the duration of a retrospective. */
export function retrospectiveFacts(store: Store, job: TicketJob, pending: Pick<PendingRetrospective, 'id' | 'trigger' | 'event'>): RetrospectivePacket {
    const repository = store.project.repository || '', issueNumber = Number(job.key.replace(/^GH-/, ''));
    const issueUrl = repository && Number.isFinite(issueNumber) ? `https://github.com/${repository}/issues/${issueNumber}` : '';
    const prUrl = job.prUrl || (job.pr && repository ? `https://github.com/${repository}/pull/${job.pr}` : '');
    const link = prUrl || issueUrl;
    const catalog: Record<string, LessonEvidence> = {};
    catalog[`job:${job.id}`] = { kind: 'job', ref: `job:${job.id}`, url: issueUrl, detail: clip(`${job.key} · ${job.status} at ${job.stage}`, SHORT) };
    if (job.pr) catalog[`pr:${job.id}:${job.pr}`] = { kind: 'pr', ref: `pr:${job.id}:${job.pr}`, url: prUrl, detail: `PR #${job.pr}` };
    const trigger = Math.min(Math.max(pending.event.steps - 1, 0), Math.max(job.steps.length - 1, 0));
    const window = job.steps.map((step, index) => ({ step, index })).slice(-ENTRIES);
    if (job.steps[trigger] && !window.some(entry => entry.index === trigger)) window.unshift({ step: job.steps[trigger], index: trigger });
    const steps = window.map(({ step, index }) => {
        const ref = `step:${job.id}:${index}`, result = step.result;
        catalog[ref] = { kind: 'step', ref, url: link, detail: clip(`${step.stage} · ${result.outcome}: ${result.summary}`, SHORT) };
        const findings = (result.findings || []).slice(0, ENTRIES).map(finding => {
            const findingRef = `finding:${job.id}:${index}:${finding.id}`;
            catalog[findingRef] = { kind: 'finding', ref: findingRef, url: link, detail: clip(`${finding.id}: ${finding.summary}`, SHORT) };
            return { ref: findingRef, id: finding.id, status: finding.status, summary: clip(finding.summary), expected: clip(finding.expected, SHORT), actual: clip(finding.actual, SHORT), attempts: finding.attempts };
        });
        return { ref, index, stage: step.stage, outcome: result.outcome, summary: clip(result.summary), blocker: clip(result.blocker), commit: result.commit, resolution: result.resolution ? { kind: result.resolution.kind, findingIds: result.resolution.findingIds.slice(0, ENTRIES) } : null, findings, receipts: (result.receipts || []).length, evidence: (result.evidence || []).length };
    });
    const packet: RetrospectivePacket = {
        trigger: { id: pending.id, kind: pending.trigger, event: pending.event },
        job: { id: job.id, key: job.key, status: job.status, stage: job.stage, issueUrl, pr: job.pr, prUrl, head: job.head, detail: clip(job.detail), approach: job.approach ? { ...job.approach, checks: job.approach.checks.slice(0, ENTRIES).map(check => clip(check, SHORT)), reason: clip(job.approach.reason) } : null },
        steps,
        decisions: (job.decisions || []).slice(-10).map(decision => ({ role: decision.role, stage: decision.stage, at: decision.at, plan: decision.approach.plan, review: decision.approach.review, validation: decision.approach.validation, reason: clip(decision.approach.reason, SHORT) })),
        ciRepairs: (job.ciRepairs || []).slice(-5).map(repair => ({ id: repair.id, phase: repair.phase, head: repair.head, kind: repair.plan?.kind || '', summary: clip(repair.plan?.summary, SHORT) })),
        timing: (job.timing || []).slice(-ENTRIES).map(timing => ({ stage: timing.stage, queueMs: timing.queueMs, claimedAt: timing.claimedAt })),
        conversation: [
            ...store.state.messages.filter(message => message.ticket === job.key).slice(-ENTRIES).map(message => ({ from: message.from, to: message.to, at: message.createdAt, body: clip(message.body, SHORT) })),
            ...(store.state.outbox || []).filter(item => item.ticket === job.key).slice(-ENTRIES).map(item => ({ outbox: item.title, status: item.status, detail: clip(item.detail, SHORT) })),
        ].slice(-ENTRIES),
        notes: store.state.projectNotes.filter(note => note.ticket === job.key).slice(-10).map(note => ({ summary: clip(note.summary, SHORT), detail: clip(note.detail, SHORT) })),
        activeLessons: (store.state.knowledge?.lessons || []).filter(lesson => lesson.status === 'active').slice(-ENTRIES).map(lesson => ({ id: lesson.id, statement: lesson.statement })),
        omitted: {},
        catalog,
    };
    // Drop the least useful optional history first; the trigger, job identity and triggering step stay.
    const drop: (keyof Pick<RetrospectivePacket, 'conversation' | 'timing' | 'notes' | 'activeLessons' | 'decisions' | 'ciRepairs' | 'steps'>)[] = ['conversation', 'timing', 'notes', 'activeLessons', 'decisions', 'ciRepairs', 'steps'];
    for (const section of drop)
        while (JSON.stringify(packet).length > PACKET_LIMIT && packet[section].length > (section === 'steps' ? 1 : 0)) {
            const index = section === 'steps' ? packet.steps.findIndex(step => (step as { index: number }).index !== trigger) : 0;
            if (index < 0) break;
            const [removed] = (packet[section] as unknown[]).splice(index, 1);
            packet.omitted[section] = (packet.omitted[section] || 0) + 1;
            if (section === 'steps') for (const ref of Object.keys(catalog)) if (ref === `step:${job.id}:${(removed as { index: number }).index}` || ref.startsWith(`finding:${job.id}:${(removed as { index: number }).index}:`)) delete catalog[ref];
        }
    // Last resort: a single step with many long findings is trimmed from the end, keeping the bound.
    for (const step of packet.steps as { findings: { ref: string }[] }[])
        while (JSON.stringify(packet).length > PACKET_LIMIT && step.findings.length) {
            delete catalog[step.findings.pop()!.ref];
            packet.omitted.findings = (packet.omitted.findings || 0) + 1;
        }
    return packet;
}
