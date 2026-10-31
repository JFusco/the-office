import type { OfficeEntry } from './scheduled-work';
import { goalEvidenceFingerprint, projectPRFacts } from './goal-reporting';
export function collectCTOFacts(entries: OfficeEntry[], collectedAt: string) {
    return { collectedAt, projects: entries.map(({ store, engine }) => ({
            projectId: store.project.id, project: store.project.name, paused: store.state.paused, draining: !!store.state.draining,
            sourceVersion: store.state.revision, providerObservedAt: (store.project.provider === 'github' ? store.state.github : store.state.azure)?.observedAt || '',
            providerError: (store.project.provider === 'github' ? store.state.github : store.state.azure)?.error || '',
            pullRequests: projectPRFacts(store), goalEvidenceInputFingerprint: goalEvidenceFingerprint(store),
            deliveryUpdates: store.state.messages.filter(message => ['pm', 'developer', 'lead', 'qa'].includes(message.from) && message.status === 'answered' && !message.error && (!message.contextProject || message.contextProject === store.project.id) && message.receipts.every(receipt => receipt.verified && !receipt.uncertain)).sort((a, b) => Number(!!a.goalReport) - Number(!!b.goalReport)).slice(-20).map(({ id, from, ticket, createdAt, body, goalReport }) => ({ id, from, ticket, createdAt, body: body.slice(0, 4000), goalReport })),
            goals: store.state.goals || [], assignments: store.state.coordination?.listener.assigned || [],
            intake: store.state.coordination?.listener.reviews.map(({ id, key, status, detail, owner, prerequisites }) => ({ id, key, status, detail, owner, prerequisites })) || [],
            jobs: (store.state.coordination?.jobs || []).map(({ id, key, status, stage, updatedAt, head, mergeCommit, detail, steps }) => ({ id, key, status, stage, version: updatedAt, head: mergeCommit || head, detail, acceptance: status === 'completed' ? steps.filter(step => step.stage === 'closeout') : [] })),
            tickets: store.state.tickets.map(({ key, summary, stage, activity, blocker, updated, commit, results }) => ({ key, summary, stage, activity, blocker, version: updated, head: commit, acceptance: results['staging-qa'] || null })),
            maintenance: (store.state.maintenance?.runs || []).map(({ id, status, stage, startedAt, endedAt, error, steps }) => ({ id, status, stage, version: endedAt || startedAt, error, latestResult: steps.at(-1)?.result || null })),
            latestCompletedMaintenance: store.state.maintenance?.runs.filter(run => run.status === 'completed').at(-1)?.id || '',
            operationalInformation: 'Time, assignment and general health gaps are operational context; only goal-specific functional impediments belong in goal blockers.',
            health: { workers: store.state.workLog?.filter(work => ['running', 'stopping'].includes(work.status)).map(({ id, role, status, lastHeartbeatAt }) => ({ id, role, status, lastHeartbeatAt })) || [], busy: engine.busy, it: store.state.it?.reports.at(-1) || null },
            time: { entries: store.state.coordination?.time?.entries || [], pending: store.state.coordination?.time?.publications?.filter(publication => publication.status !== 'verified') || [] },
            evidenceGaps: [!(store.project.provider === 'github' ? store.state.github : store.state.azure)?.observedAt ? 'No confirmed provider observation' : '', store.state.coordination?.listener.error || ''].filter(Boolean),
        })) };
}
