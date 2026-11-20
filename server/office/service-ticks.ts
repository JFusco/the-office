import { enqueueRequest } from '../scheduling/requests';
import { sanitize } from './security';
import { redactEvidence } from '../incidents/redact-evidence';
import { watchDeployedFixes } from '../incidents/watch-deployed-fixes';
import { command } from '../workers/process';
import { DATA, ROOT } from './config';
import type { ServiceContext } from './http/context';
import { releaseIdentity } from './release-identity';

/** Background scheduling, checkpoint, IT, incident-observation and provider-refresh timers; returns a stop function. */
export function startServiceTicks({ offices, itSpecialist, loadedRevision }: Pick<ServiceContext, 'offices' | 'itSpecialist' | 'loadedRevision'>): () => void {
    // A fence that cannot be read counts as held, and never throws out of a timer callback.
    const fenced = () => { try { return offices.fenced(); } catch (e) { console.error(sanitize(String(e))); return true; } };
    const conversationTick = setInterval(() => { void offices.pump().catch(e => console.error(sanitize(String(e)))); }, 2000);
    const checkpointTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void offices.tick().catch(e => console.error(sanitize(String(e))));
    }, 15000);
    // ITSpecialist.tick checks the fence itself, before it advances its due marker.
    const itTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void itSpecialist.tick().catch(e => console.error(sanitize(String(e))));
    }, 15000);
    // Reads stopped work into the incident ledger. Local only: no provider is called and no project store is written.
    // Then compares the release this service runs with fixes bound to shipped incidents; that reads GitHub, once per release and fix.
    // The comparison counts as an operation in flight, so a deployment that takes the fence meanwhile waits for it to end.
    const loadedHash = loadedRevision.hash;
    const compareRelease = watchDeployedFixes({ ledger: offices.incidents, identity: () => releaseIdentity({ root: ROOT, dataRoot: DATA, loadedHash }), loadedHash, execute: command, allowed: () => !fenced() });
    const incidentTick = setInterval(() => {
        if (fenced()) return;
        try { offices.observeIncidents(); } catch (e) { console.error(redactEvidence(String(e))); }
        if (process.env.OFFICE_NO_POLL !== '1') void offices.operations.run(compareRelease);
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
