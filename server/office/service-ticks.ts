import { enqueueRequest } from '../scheduling/requests';
import { sanitize } from './security';
import type { ServiceContext } from './http/context';

/** Background scheduling, checkpoint, IT and provider-refresh timers; returns a stop function. */
export function startServiceTicks({ offices, itSpecialist }: Pick<ServiceContext, 'offices' | 'itSpecialist'>): () => void {
    const conversationTick = setInterval(() => { void offices.pump().catch(e => console.error(sanitize(String(e)))); }, 2000);
    const checkpointTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void offices.tick().catch(e => console.error(sanitize(String(e))));
    }, 15000);
    const itTick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL !== '1')
            void itSpecialist.tick().catch(e => console.error(sanitize(String(e))));
    }, 15000);
    const lastPoll = new Map<string, number>();
    const tick = setInterval(() => {
        if (process.env.OFFICE_NO_POLL === '1')
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
    return () => { clearInterval(tick); clearInterval(itTick); clearInterval(checkpointTick); clearInterval(conversationTick); };
}
