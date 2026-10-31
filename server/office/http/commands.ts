import { TimeClassificationInput } from '../../time/time-classification';
import { DiscoveryResumeInput, bindDiscoveryResume } from '../../delivery/recovery/implementation/discovery-recovery';
import { reconcileGoalReportCommand } from '../../leadership/goal-reporting';
import { enqueueRequest, enqueueSourceAmendment, enqueueCloseoutReconciliation } from '../../scheduling/requests';
import { reconcileReadRetries } from '../../scheduling/read-retries';
import { configureNotices, retryRecipientLookup } from '../../conversations/notifications';
import { timeLedger } from '../../time/time-ledger';
import { validTicket } from '../projects';
import { CEC } from '../config';
import type { ServiceContext, RequestContext } from './context';
import { json } from './responses';

/** POST /api/commands: operator and harness commands for one project. */
export async function commandRoute(req: Request, url: URL, context: ServiceContext & RequestContext): Promise<Response | undefined> {
    const { offices, serviceHealth, itSpecialist, loadedRevision, snapshot, vite, project, store, engine, conversations, coordinator } = context;
    if (url.pathname === '/api/commands') {
        if (req.method !== 'POST')
            return json({ error: 'POST required' }, 405);
        if (Number(req.headers.get('content-length') || 0) > 4096)
            return json({ error: 'Command is too large' }, 413);
        const body = await req.text();
        if (body.length > 4096)
            return json({ error: 'Command is too large' }, 413);
        const { action, key, scheduled, authorization, pickup, notifications, time, merges, replacementProject, replacementId, messageId, checkpointId, head, amendment, timeClassification, discovery, closeoutSupervisionProof } = JSON.parse(body);
        if (key && (typeof key !== 'string' || !validTicket(store.project, key)))
            return json({ error: 'Issue key does not belong to this project' }, 400);
        switch (action) {
            case 'authorize-source-amendment': return json({ accepted: true, id: enqueueSourceAmendment(store, amendment).id }, 202);
            case 'reconcile-goal-report': return json(reconcileGoalReportCommand(store, messageId), 202);
            case 'reconcile-conversation':
                offices.reconcileConversation(store.project.id, messageId, replacementProject, replacementId);
                break;
            case 'check-it': return json({ accepted: true, id: enqueueRequest(store, 'check-it', '', '', 'it').id }, 202);
            case 'activate-checkpoints':
                coordinator!.activate();
                break;
            case 'retry-checkpoint': return json({ accepted: true, id: enqueueRequest(store, action, checkpointId, head || '').id }, 202);
            case 'retry-notice-recipient':
                retryRecipientLookup(store, key);
                break;
            case 'configure-notifications':
                void coordinator!.state;
                configureNotices(store, notifications);
                break;
            case 'reconcile-read-retries':
                reconcileReadRetries(store);
                break;
            case 'defer-non-ready': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'reconcile-time': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'configure-time': {
                void coordinator!.state;
                if (typeof time?.enabled !== 'boolean' || typeof time?.githubField !== 'boolean')
                    throw new Error('Invalid time settings');
                const ledger = timeLedger(store);
                if (ledger.enabled && !time.enabled)
                    ledger.disabledSince = new Date().toISOString();
                if (!ledger.enabled && time.enabled && ledger.disabledSince) {
                    (ledger.disabledPeriods ??= []).push({ start: ledger.disabledSince, end: new Date().toISOString() });
                    ledger.disabledSince = undefined;
                }
                ledger.enabled = time.enabled;
                ledger.githubField = time.githubField;
                if (typeof time.jira === 'boolean')
                    ledger.jiraEnabled = time.jira;
                if (time.jira === true && !ledger.jiraActivatedAt) {
                    ledger.jiraActivatedAt = new Date().toISOString();
                    ledger.jiraConnection = `twg:${CEC.site}`;
                }
                store.save();
                break;
            }
            case 'configure-merges': {
                if (store.project.provider !== 'github' || typeof merges?.enabled !== 'boolean')
                    throw new Error('Invalid GitHub merge setting');
                coordinator!.state.merges = { enabled: merges.enabled, authorizedAt: new Date().toISOString() };
                store.emit('merge-policy', merges.enabled ? 'Sam may merge linked issue PRs after current-head review and required checks, then Morgan closes out the issue and board.' : 'Automatic PR merging disabled.', 'pm');
                break;
            }
            case 'configure-pickup':
                coordinator!.configurePickup(pickup);
                break;
            case 'start-assigned':
                coordinator!.requestWork(key);
                break;
            case 'retry-daily-cto': {
                if (typeof checkpointId !== 'string' || !checkpointId) return json({ error: 'Daily CTO report ID is required' }, 400);
                const report = offices.dailyCTO.queueRecovery(checkpointId);
                return json({ accepted: true, id: report.id, status: report.status }, 202);
            }
            case 'correct-recovery-time': {
                const input = TimeClassificationInput.parse(timeClassification);
                const prior = store.state.coordination!.requests?.find(request => request.action === action && request.head === input.expectedSha256 && request.status === 'completed');
                if (prior) return json({ accepted: true, id: prior.id, status: prior.status }, 202);
                const request = store.transaction(() => { const request = enqueueRequest(store, action, '', input.expectedSha256); request.timeClassification = input; store.save(); return request; });
                return json({ accepted: true, id: request.id }, 202);
            }
            case 'resume-discovery': {
                const input = DiscoveryResumeInput.parse(discovery);
                const previous = store.state.coordination!.requests?.find(request => request.action === action && request.key === key && request.head === head && request.discoveryResume?.noteId === input.noteId && ['queued', 'working', 'completed'].includes(request.status));
                if (previous) return json({ accepted: true, id: previous.id, status: previous.status }, 202);
                const binding = bindDiscoveryResume(store, key, head, discovery);
                const request = store.transaction(() => {
                    const request = enqueueRequest(store, action, key, head);
                    if (request.discoveryResume && JSON.stringify(request.discoveryResume) !== JSON.stringify(binding)) throw new Error('Queued discovery scope differs');
                    request.discoveryResume = binding; store.save(); return request;
                });
                return json({ accepted: true, id: request.id }, 202);
            }
            case 'reconcile-validation':
            case 'reconcile-implementation': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'adopt-candidate': return json({ accepted: true, id: enqueueRequest(store, action, key).id }, 202);
            case 'reconcile-scope-repair':
            case 'reconcile-preparation': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'approve-merge': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'reconcile-activation':
            case 'reconcile-review': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'reconcile-base-update': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'reconcile-closeout': return json({ accepted: true, id: enqueueCloseoutReconciliation(store, key, head || '', closeoutSupervisionProof).id }, 202);
            case 'prepare-pr':
                coordinator!.preparePR(key);
                break;
            case 'repair-pr-conflicts': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'reconcile-pr-link': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
            case 'update-candidate-base':
                coordinator!.updateCandidateBase(key);
                break;
            case 'review-candidate':
                coordinator!.recheckCandidate(key);
                break;
            case 'review-pr':
                coordinator!.recheckPR(key);
                break;
            case 'review-assignment':
                coordinator!.recheck(key);
                break;
            case 'maintenance': return json({ accepted: true, run: engine.requestMaintenance(scheduled === true) }, 202);
            case 'check-mail':
                engine.requestMail(scheduled === true);
                break;
            case 'drain':
                store.state.draining = true;
                store.emit('draining', 'New dispatch paused; existing workers may finish.');
                break;
            case 'pause':
                engine.pause();
                break;
            case 'resume':
                engine.unpause();
                break;
            case 'start-pilot': return json({ accepted: true, request: engine.requestDelivery(key, 'start-pilot') }, 202);
            case 'resume-ticket': return json({ accepted: true, request: engine.requestDelivery(key, 'resume-ticket') }, 202);
            case 'refresh-azure': return json({ accepted: true, id: enqueueRequest(store, 'refresh').id }, 202);
            case 'activate-nightly':
                engine.enableNightly(authorization);
                break;
            default: return json({ error: 'Unknown office command' }, 400);
        }
        store.emit('command-recorded', `${action} recorded by the harness.`);
        return json({ accepted: true, id: store.state.events[0]?.id, action }, 202);
    }
    return undefined;
}
