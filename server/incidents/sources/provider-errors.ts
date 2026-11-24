import type { IncidentCandidate } from '../../../src/contracts/incidents';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector, ProjectObservation } from '../observation';

/** A reader keeps its last error while its next read is under way; only a completed read clears it. */
const failing = (reader: { status?: string; error?: string } | undefined) => !!reader?.error && ['blocked', 'working'].includes(reader.status ?? '') ? reader.error : '';
const at = (time: string | undefined) => Date.parse(time ?? '');

/**
 * The intake run whose typed failure is the standing Jira mailbox error, when the record proves it: the
 * last intake run, its failure standing and repeated by the error, run wholly within the check that
 * recorded the failure and started after the last successful check. Anything less leaves the error
 * unbound, so a direct list read that fails the same way never borrows an earlier check's run.
 */
function failedIntakeRun({ state, lastFailedMailCheck }: Pick<ProjectObservation, 'state' | 'lastFailedMailCheck'>, error: string) {
    const run = state.workLog?.filter(run => run.stage === 'intake').at(-1), said = normalizeCause(run?.failure?.detail).slice(0, 80);
    if (!run?.failure || run.completionAccepted || !said || !normalizeCause(error).includes(said)) return undefined;
    const started = at(run.startedAt), ended = at(run.endedAt), lastSuccess = at(state.intake.lastChecked);
    if (Number.isFinite(lastSuccess) && started <= lastSuccess) return undefined;
    const check = lastFailedMailCheck();
    return check && started >= at(check.checkedAt) && started <= ended && ended <= at(check.blockedAt) ? run : undefined;
}

/**
 * The error each provider reader last recorded: the assignment listener, the mailbox intake, the
 * GitHub observation and the Azure observation. Each keeps only its latest error and clears it on
 * the next success, so one standing error is one episode however many polls repeat it. A GitHub
 * project's mailbox is the GitHub read itself, so its intake error is that same error and is
 * reported once. A Jira mailbox error can be the words of the model that enumerated a board: it
 * is the harness's only when no intake run handed it back, or that run's failure is typed. The run
 * whose failure the error is belongs to the mailbox subject.
 */
export const providerErrors: IncidentCollector = observation => {
    const { projectId, provider, state } = observation;
    const github = failing(state.github), intake = failing(state.intake), run = state.workLog?.filter(run => run.stage === 'intake').at(-1);
    const errors: [id: string, error: string, author: 'harness' | 'unknown'][] = [
        ['assignment-listener', state.coordination?.listener.error ?? '', 'harness'],
        ['intake', provider === 'github' || intake === github ? '' : intake, !run || run.failure ? 'harness' : 'unknown'],
        ['github', github, 'harness'],
        ['azure', failing(state.azure), 'harness'],
    ];
    return errors.flatMap(([id, error, author]): IncidentCandidate[] => {
        if (!error) return [];
        const worked = id === 'intake' ? failedIntakeRun(observation, error) : undefined;
        const mailCheckOutcomeId = id === 'intake' ? observation.lastMailCheckOutcome()?.id ?? 0 : undefined;
        return [{
            subject: { projectId, kind: 'provider', id, episode: '', stage: id, stop: null, lastWorker: worked?.id ?? '', head: '', unsettledEffect: false,
                ...(mailCheckOutcomeId === undefined ? {} : { mailCheckOutcomeId }) },
            cause: { source: 'provider-error', provider, stage: id, kind: 'read-failed', text: author === 'harness' ? normalizeCause(error) : '', author },
            expected: null,
            evidence: boundedEvidence(error),
            ...(worked ? { absorbs: [`${projectId}/worker/${worked.id}`] } : {}),
        }];
    });
};
