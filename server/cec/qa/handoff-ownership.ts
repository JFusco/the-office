import type { Store } from '../../store/store';
import type { OwnershipRead } from '../implementation-continuation/intent';
import type { QAOwnershipProof } from '../../../src/contracts/office-qa-handoff';
import { readOwnershipCandidate, type ReadOwnershipView } from './read-ownership-candidate';

export interface ReadbackOwnerDecision { key: string; existingOwner: string; blocker: string }

/** QA consumption additionally requires the independent current PM decision. */
export async function handoffOwnership(store: Store, key: string, read: OwnershipRead,
    coordinatorId?: string, decision?: ReadbackOwnerDecision): Promise<QAOwnershipProof> {
    const candidate = readOwnershipCandidate(store.project, key, await read(key) as ReadOwnershipView, coordinatorId);
    if (candidate?.kind === 'clear') return candidate;
    if (!candidate || decision?.key !== key || decision.existingOwner !== '' || decision.blocker !== '')
        throw new Error('Complete fresh ownership and positively verified coordination are required; unknown or competing actors remain blocked');
    return { ...candidate, kind: 'coordinated' };
}
