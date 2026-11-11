import { failEvidenceCapture } from './capture-failure';
import { resumeAssessmentIntake } from './intake-routing';
import type { OfficeEntry } from '../../scheduling/scheduled-work';
import { assessmentEnabled, assessmentEpisodes, saveAssessment, closeAssessment } from './disposition-store';
import { captureRequests } from './capture-store';
import { maintainCaptureRequests, capturesEnabled, captureAllowed } from './scheduled-captures';
import { cancelObsoleteAssessments } from './planning-assessment';

/** Runs after stopped-process cleanup. Never releases a worker claim or reserves capacity. */
export function maintainAssessmentWork(entry: OfficeEntry) {
    const { store } = entry;
    cancelObsoleteAssessments(store);
    if (!capturesEnabled(store)) return;
    const now = store.clock.now();
    const claims = store.activeClaims();
    const captures = captureRequests(store).filter(capture => captureAllowed(store,capture.target) && capture.status === 'working' && !claims.some(c => c.work.id === 'evidence-capture:' + capture.target));
    const episodes = (assessmentEnabled(store) ? assessmentEpisodes(store) : []).filter(episode => !episode.closedAt && !episode.result && episode.attemptId && episode.recoveredAttemptId !== episode.attemptId && !claims.some(c => c.work.kind === 'assessment' && c.work.id === 'assessment:' + episode.id));
    // A transaction rewrites the whole project state, and this runs on every pump: open one only for work.
    if (captures.length || episodes.length) store.transaction(() => {
        for (const capture of captures) failEvidenceCapture(store,capture,'Evidence capture interrupted before completion');
        for (const episode of episodes) {
            episode.recoveredAttemptId = episode.attemptId;
            episode.reason = 'Assessment interrupted before a result was committed';
            if (episode.attempts >= 3) closeAssessment(store, episode, 'ordinary-by-unavailable', now);
            else {
                episode.nextAt = new Date(now.getTime() + (episode.attempts <= 1 ? 30_000 : 120_000)).toISOString();
                episode.enqueuedAt = episode.nextAt; saveAssessment(store, episode);
            }
        }
    });
    if (store.state.coordination?.listener.reviews.some(review => review.status === 'held' && review.assessmentHold)) store.transaction(() => resumeAssessmentIntake(store));
    maintainCaptureRequests(store, now);
}
