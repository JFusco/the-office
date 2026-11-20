import type { IncidentCandidate, IncidentCause } from '../../../src/contracts/incidents';
import { boundedEvidence } from '../bounded-evidence';
import { expectedWait } from '../expected-block';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';
import { touchesUnsettled } from '../../operations/stale-records';
import { stoppedRecord } from './stopped-record';

/**
 * Work the scheduler will not run. Everything its projection calls blocked is recorded, and so is
 * waiting work whose own record is a stop: a pull request that is not ready, checks still running,
 * a merge waiting for approval, a review that needs follow-up. A record that could run but is held
 * by the scheduler's condition (a prerequisite, a configured hold) is described by that condition,
 * not by whatever the record last said; a configured hold, a planned retry and an unfinished
 * prerequisite are recorded even when the scheduler only calls the work waiting. A paused or draining project is one subject, the
 * project, because the pause hides every other reason.
 */
export const stoppedWork: IncidentCollector = ({ projectId, provider, state, progression, unsettled, holds, dependency, now }) => {
    if (state.paused || state.draining) {
        // One cause for both: draining is a pause that lets running work finish. Records the pause hides keep what they cover.
        const absorbs = progression.filter(({ work }) => work.projectId === projectId).flatMap(({ work, stage }) => { const record = stoppedRecord(state, work, stage); return record?.standing === 'stopped' ? record.covers.map(([kind, id]) => `${projectId}/${kind}/${id}`) : []; });
        return [{ subject: { projectId, kind: 'project', id: projectId, episode: '', stage: '', stop: null, lastWorker: '', head: '', unsettledEffect: false },
            cause: { source: 'stopped-work', provider, stage: '', kind: 'paused', text: '', author: 'harness' }, expected: 'pause', evidence: state.draining ? 'Office is draining' : 'Project is paused', absorbs: [...new Set(absorbs)] }];
    }
    const candidates: IncidentCandidate[] = [];
    for (const { work, stage, eligibility } of progression) {
        if (work.projectId !== projectId) continue;
        const record = stoppedRecord(state, work, stage), own = record?.standing === 'stopped';
        if (record?.standing === 'ignored') continue;
        const waiting = eligibility.state === 'waiting', held = !!record && [record.key, ...(record.keys ?? [])].some(key => !!key && Object.hasOwn(holds, key)), retrying = !!record?.retryAt && Date.parse(record.retryAt) > now.getTime();
        // The scheduler's own reading of the record's structured prerequisites, never the wording of its reason.
        const awaited = waiting && !!record?.prerequisites?.length && dependency(record.prerequisites)?.state === 'waiting';
        // Waiting work is recorded when its own record is a stop, or when the wait is a configured hold, a planned retry or an unfinished prerequisite.
        if (!(eligibility.state === 'blocked' || waiting && (own || held || retrying || awaited))) continue;
        // Text is identity only when the harness is known to have written it.
        const author: IncidentCause['author'] = own ? record.author : record ? 'harness' : 'unknown', text = own ? record.text || eligibility.reason : eligibility.reason;
        // The scheduler's cause can come from the wording of text the harness did not write; such a stop gets a kind that cannot change with it.
        const told = own && author !== 'harness';
        const kind = (own && record.kind) || (held ? 'hold' : retrying ? 'retry' : awaited ? 'dependency' : told ? 'unclassified' : eligibility.cause) || (own ? 'unclassified' : 'gated');
        candidates.push({
            subject: { projectId, kind: work.kind, id: work.id, episode: own ? record.episode : '', stage, stop: own ? record.stop : null, lastWorker: record?.lastWorker ?? '', head: record?.head ?? '', unsettledEffect: touchesUnsettled(unsettled, record?.effects ?? [work]) },
            cause: { source: 'stopped-work', provider, stage, kind, text: author === 'harness' ? normalizeCause((own && record.identity) || text) : '', author },
            // A model's words never choose the explanation: the stop kind derived from them is left out.
            expected: expectedWait({ ...(own ? record.facts : {}), hold: held, retrying: (own && record.facts.retrying) || retrying, cause: (own ? record.facts.cause : undefined) ?? (awaited ? 'dependency' : told ? undefined : eligibility.cause) }),
            evidence: boundedEvidence(text),
            absorbs: own ? record.covers.map(([kind, id]) => `${projectId}/${kind}/${id}`) : undefined,
        });
    }
    return candidates;
};
