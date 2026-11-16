import { AsyncLocalStorage } from 'node:async_hooks';

type Ownership = { complete: boolean; fresh: boolean; ownership?: { status: string } };
type RefreshOwnership = () => Promise<Ownership>;
const ownershipContext = new AsyncLocalStorage<RefreshOwnership>();
export const refreshDeliveryOwnership = () => { const refresh=ownershipContext.getStore(); if(!refresh)throw new Error('Scheduler ownership refresh unavailable'); return refresh(); };
export const withAmendmentOwnership = <T>(refresh: RefreshOwnership, operation: () => T): T => ownershipContext.run(refresh, operation);
