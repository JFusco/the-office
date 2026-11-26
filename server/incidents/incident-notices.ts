import { subjectKey, type Incident } from '../../src/contracts/incidents';
import type { HumanAction } from '../../src/shared';
import type { IncidentLedger } from './incident-ledger';
import { RUNNER_INCIDENT, RUNNER_SUBJECT } from './record-runner-failure';
import type { HaltReport } from './runner-report';
import type { RunnerReports } from './runner-reports';

/** The outbox kinds these notices use: no project produces them, and the outbox collector leaves them alone. */
export const NOTICE_KINDS = ['overseer-incident', 'overseer-stopped'] as const;
export const isNotice = (id: string) => (NOTICE_KINDS as readonly string[]).includes(id.split(':')[0]);

const STATUS = { text: 'Read what the Overseer runner reports', run: 'pnpm office overseer status' };

/**
 * What the Overseer runner has told the Office that a person should see: the Office down as the
 * runner saw it, while that outage is open in the runner's incident, and a stopped runner, while
 * its latest report says so. Office-wide, the same in every project's outbox, and never saved
 * into one. A paused runner is not a notice: a person paused it.
 */
export function incidentNotices(incident: Incident | null, halt: HaltReport | null): HumanAction[] {
    const notices: HumanAction[] = [];
    const subject = incident?.subjects.find(candidate => subjectKey(candidate) === subjectKey(RUNNER_SUBJECT) && candidate.status === 'open');
    if (incident && subject) notices.push({
        id: `overseer-incident:${incident.id}`, title: 'The Overseer runner saw the Office down', role: 'it', ticket: '', url: '', status: 'open',
        detail: `The runner could not read the Office's health from ${subject.stop?.at ?? subject.openedAt}: ${subject.evidence}`,
        createdAt: subject.openedAt, updatedAt: incident.lastObservedAt,
        ownerSteps: {
            why: `The Overseer runner journaled an outage of the Office (episode ${subject.episode}) and has not yet reported it restored.`,
            steps: [STATUS, { text: `Check the outage it names in its journal, ${subject.episode}, against the Office's own health and logs` }],
            doneWhen: 'The runner reports the service restored and this notice clears.',
        },
    });
    if (halt?.kind === 'stopped') {
        const control = `control/${halt.control}`;
        notices.push({
            id: 'overseer-stopped', title: 'The Overseer runner is stopped', role: 'it', ticket: '', url: '', status: 'open',
            detail: `${halt.reason}${halt.since ? ` (since ${halt.since})` : ''}`,
            createdAt: halt.since ?? halt.reportedAt, updatedAt: halt.reportedAt,
            ownerSteps: {
                why: halt.reason,
                steps: halt.control === 'pause.json'
                    ? [STATUS, { text: `${control} cannot be read: keep a copy, then repair it or remove it; the runner is paused while a valid one remains` }]
                    : [STATUS, { text: `Settle what ${control} names first, keeping the evidence it lists` }, { text: `Then remove ${control}` }],
                doneWhen: 'The runner reports itself running or paused and this notice clears.',
            },
        });
    }
    return notices;
}

/**
 * The notices as the control database reads now: the runner's incident by its fixed ID, and its
 * latest halt report. Writes nothing. Both readers are required, so no caller can leave a notice
 * out by omitting one; an empty control database reads as no notices.
 */
export function readNotices(offices: { incidents: Pick<IncidentLedger, 'get'>; runnerReports: Pick<RunnerReports, 'halt'> }): HumanAction[] {
    return incidentNotices(offices.incidents.get(RUNNER_INCIDENT), offices.runnerReports.halt());
}
