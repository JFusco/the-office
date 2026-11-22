import { enqueueRequest } from '../scheduling/requests';
import { timedStep } from '../scheduling/step-timings';
import { sanitize } from './security';
import { sourceVersions } from '../incidents/cited-sources';
import { invalidateDismissals } from '../incidents/dismissal-validity';
import { redactEvidence } from '../incidents/redact-evidence';
import { admitRepairWaits } from '../incidents/repair/admit-repair-waits';
import { judgeResumes } from '../incidents/repair/judge-resumes';
import { dispatchResumes } from '../incidents/repair/resume-arrivals';
import { releaseWatch } from '../incidents/repair/running-release';
import { settleIncidents } from '../incidents/repair/settle-incidents';
import { command } from '../workers/process';
import { DATA, ROOT } from './config';
import type { ServiceContext } from './http/context';
import { releaseIdentity } from './release-identity';

/** Background scheduling, checkpoint, IT, incident-observation and provider-refresh timers; returns a stop function. */
export function startServiceTicks({ offices, itSpecialist, loadedRevision }: Pick<ServiceContext, 'offices' | 'itSpecialist' | 'loadedRevision'>): () => void {
    // A fence that cannot be read counts as held, and never throws out of a timer callback.
    const fenced = () => { try { return offices.fenced(); } catch (e) { console.error(sanitize(String(e))); return true; } };
    const conversationTick = setInterval(() => { void timedStep(offices.stepTimings, 'timer: pump (start)', () => offices.pump()).catch(e => console.error(sanitize(String(e)))); }, 2000);
    const checkpointTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void timedStep(offices.stepTimings, 'timer: tick (start)', () => offices.tick()).catch(e => console.error(sanitize(String(e))));
    }, 15000);
    // ITSpecialist.tick checks the fence itself, before it advances its due marker.
    const itTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void timedStep(offices.stepTimings, 'timer: IT tick (start)', () => itSpecialist.tick()).catch(e => console.error(sanitize(String(e))));
    }, 15000);
    // Reads stopped work into the incident ledger. Local only: no provider is called and no project store is written.
    // Then compares the release this service runs with fixes bound to shipped incidents; that reads GitHub, once per release and fix.
    // The comparison counts as an operation in flight, so a deployment that takes the fence meanwhile waits for it to end.
    // Between the two, a dismissal whose cited code or covered stops changed is returned to observed. Local only.
    const loadedHash = loadedRevision.hash, versions = sourceVersions(loadedRevision.manifest);
    // What GitHub said of a release and a fix is kept by the comparison and read by the resume pass: a fix is resumed only in a release known to hold it.
    const release = releaseWatch({ ledger: offices.incidents, identity: () => releaseIdentity({ root: ROOT, dataRoot: DATA, loadedHash }), loadedHash, execute: command, allowed: () => !fenced() });
    const incidentTick = setInterval(() => {
        if (timedStep(offices.stepTimings, 'incidents: fence', fenced)) return;
        try { timedStep(offices.stepTimings, 'incidents: observe', () => offices.observeIncidents()); } catch (e) { console.error(redactEvidence(String(e))); }
        try { timedStep(offices.stepTimings, 'incidents: dismissals', () => invalidateDismissals(offices.incidents, versions, new Date())); } catch (e) { console.error(redactEvidence(String(e))); }
        // Marks, in each project's own store, the stops a repair in progress covers.
        try { timedStep(offices.stepTimings, 'incidents: repair waits', () => admitRepairWaits(offices.incidents, [...offices.entries.values()], new Date(), fenced)); } catch (e) { console.error(redactEvidence(String(e))); }
        // Then queues, once per subject and fix, the resume a fix found in the running release bound for work still awaiting it. Local only.
        try { timedStep(offices.stepTimings, 'incidents: resumes', () => dispatchResumes({ ledger: offices.incidents, entries: [...offices.entries.values()], control: offices.resumes, running: release.holding, now: () => new Date(), fenced })); } catch (e) { console.error(redactEvidence(String(e))); }
        // Then reads, in each project, what became of the resumes already queued, and records it in the ledger. Local only: no project store is written.
        try { timedStep(offices.stepTimings, 'incidents: resume outcomes', () => judgeResumes({ ledger: offices.incidents, entries: [...offices.entries.values()], running: release.holding, now: () => new Date(), fenced })); } catch (e) { console.error(redactEvidence(String(e))); }
        // Then moves an incident on once those outcomes amount to something: verified, or recurred when its cause stopped work again. Ledger only.
        try { timedStep(offices.stepTimings, 'incidents: verdicts', () => settleIncidents({ ledger: offices.incidents, running: release.holding, now: () => new Date(), fenced })); } catch (e) { console.error(redactEvidence(String(e))); }
        if (process.env.OFFICE_NO_POLL !== '1')
            void timedStep(offices.stepTimings, 'incidents: release compare (start)', () => offices.operations.run(release.compare));
    }, 60000);
    const lastPoll = new Map<string, number>();
    const tick = setInterval(() => {
        // Checked before lastPoll advances: a fenced interval is deferred to the first tick after release, not lost.
        if (process.env.OFFICE_NO_POLL === '1' || fenced())
            return;
        for (const [id, { store, engine }] of offices.entries) {
            const active = store.state.tickets.some(t => t.pilot && t.stage !== 'complete');
            const interval = store.project.provider === 'github' ? (store.state.github?.prs.some(p => p.state === 'open') || store.state.coordination?.jobs?.some(j => !['completed', 'cancelled'].includes(j.status)) ? 60000 : 120000) : active ? 30000 : 120000;
            if (Date.now() - (lastPoll.get(id) || 0) >= interval) {
                lastPoll.set(id, Date.now());
                enqueueRequest(store, 'refresh');
            }
        }
    }, 5000);
    return () => { clearInterval(tick); clearInterval(incidentTick); clearInterval(itTick); clearInterval(checkpointTick); clearInterval(conversationTick); };
}
