import type { IncidentCandidate } from '../../../src/contracts/incidents';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

/** A reader keeps its last error while its next read is under way; only a completed read clears it. */
const failing = (reader: { status?: string; error?: string } | undefined) => !!reader?.error && ['blocked', 'working'].includes(reader.status ?? '') ? reader.error : '';

/**
 * The error each provider reader last recorded: the assignment listener, the mailbox intake, the
 * GitHub observation and the Azure observation. Each keeps only its latest error and clears it on
 * the next success, so one standing error is one episode however many polls repeat it. A GitHub
 * project's mailbox is the GitHub read itself, so its intake error is that same error and is
 * reported once. A Jira mailbox error can be the words of the model that enumerated a board: it
 * is the harness's only when no intake run handed it back, or that run's failure is typed.
 */
export const providerErrors: IncidentCollector = ({ projectId, provider, state }) => {
    const github = failing(state.github), intake = failing(state.intake), run = state.workLog?.filter(run => run.stage === 'intake').at(-1);
    const errors: [id: string, error: string, author: 'harness' | 'unknown'][] = [
        ['assignment-listener', state.coordination?.listener.error ?? '', 'harness'],
        ['intake', provider === 'github' || intake === github ? '' : intake, !run || run.failure ? 'harness' : 'unknown'],
        ['github', github, 'harness'],
        ['azure', failing(state.azure), 'harness'],
    ];
    return errors.flatMap(([id, error, author]): IncidentCandidate[] => error ? [{
        subject: { projectId, kind: 'provider', id, episode: '', stage: id, stop: null, lastWorker: '', head: '', unsettledEffect: false },
        cause: { source: 'provider-error', provider, stage: id, kind: 'read-failed', text: author === 'harness' ? normalizeCause(error) : '', author },
        expected: null,
        evidence: boundedEvidence(error),
    }] : []);
};
