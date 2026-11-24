import { useLayoutEffect, useRef, useState } from 'react';
import type { OfficeSnapshot } from '../../shared';
import type { TicketProgress } from '../../contracts/ticket-progress';

export function transitionKey(progress: TicketProgress) {
    return JSON.stringify([progress.visit, progress.phase, progress.owner, progress.state, progress.next]);
}

const empty = new Map<string, string>();

/** Only transitions between two observations in the same visible connection may animate or announce. */
export function useTransitions(snapshot: OfficeSnapshot, signatures: Map<string, string>, reduced: boolean) {
    const live = snapshot.mode === 'live' && snapshot.liveAnchor?.connected && snapshot.liveAnchor.visible;
    const epoch = live ? JSON.stringify([snapshot.project?.id, snapshot.serviceInstanceId, snapshot.liveAnchor?.connectionEpoch, reduced]) : '';
    const previous = useRef<{epoch: string; values: Map<string,string>} | null>(null);
    const [changed, setChanged] = useState(empty);
    useLayoutEffect(() => {
        const prior = previous.current;
        previous.current = {epoch, values: signatures};
        if (!epoch || prior?.epoch !== epoch) {
            setChanged(empty);
            return;
        }
        const transitions = new Map<string,string>();
        for (const [key, value] of signatures) {
            const before = prior.values.get(key);
            if (before !== undefined && before !== value) transitions.set(key, value);
        }
        if (transitions.size) setChanged(transitions);
    }, [epoch, signatures]);
    return epoch && previous.current?.epoch === epoch ? changed : empty;
}
