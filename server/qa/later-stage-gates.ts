/**
 * QA judges what can be observed at its own stage. A gate that only a later stage can observe (a hosted
 * build that runs once the pull request is opened or published, publication itself) belongs to that
 * stage: waiting on it at QA can never pass, and a finding that only says it has not run yet cannot be
 * retested.
 */
export const LATER_STAGE_GATES = 'LATER-STAGE GATES: A check that can only be observed after a later stage than this one (a hosted build or policy that runs only once the pull request is opened or published, or publication itself) is not yours to wait for. Cover the part of a required check you can observe now, with its own evidence, and say in that case what remains and which stage owns it; do not report the case failed, blocked or not-tested for that remainder alone, and do not raise a finding for it. If a required check has no part you can observe now, do not invent a case for it: before executing, return reroute with the checks restated without that gate and the reason. An earlier finding that records only that such a gate has not run yet is returned verified with that reason; it is the one finding you settle without observing it pass. A gate that has run and failed, or one that is running now, is not a later-stage gate: report what you observe.';
