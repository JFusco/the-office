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
    store.transaction(() => {
        for (const capture of captureRequests(store)) {
            if (!captureAllowed(store,capture.target) || capture.status !== 'working' || store.activeClaims().some(c => c.work.id === 'evidence-capture:' + capture.target)) continue;
            failEvidenceCapture(store,capture,'Evidence capture interrupted before completion');
        }
        for (const episode of assessmentEnabled(store) ? assessmentEpisodes(store) : []) {
            if (episode.closedAt || episode.result || !episode.attemptId || episode.recoveredAttemptId === episode.attemptId || store.activeClaims().some(c => c.work.kind === 'assessment' && c.work.id === 'assessment:' + episode.id)) continue;
            episode.recoveredAttemptId = episode.attemptId;
            episode.reason = 'Assessment interrupted before a result was committed';
            if (episode.attempts >= 3) closeAssessment(store, episode, 'ordinary-by-unavailable', now);
            else {
                episode.nextAt = new Date(now.getTime() + (episode.attempts <= 1 ? 30_000 : 120_000)).toISOString();
                episode.enqueuedAt = episode.nextAt; saveAssessment(store, episode);
            }
        }
    });
    store.transaction(() => resumeAssessmentIntake(store));
    maintainCaptureRequests(store, now);
}
