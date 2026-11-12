import { LifecycleDiagnostic } from '../../workers/lifecycle/contract';
import { readOwnedSessionArtifact } from '../../store/owned-artifact';
import { slackMessageUrl } from '../../../src/shared';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';

/** The helper Codex's turn-ended notify hook starts; Office workers now launch without it (`workers/codex-notify.ts`). */
export const NOTIFY_HELPER = 'SkyComputerUseClient';

/**
 * A surviving-subprocess failure is explained when the worker's own lifecycle record shows that only the notify
 * helper was left in its process group at exit, and every Slack delivery of that request was read back confirmed.
 * Any other survivor, an unreadable or truncated record, or an unconfirmed delivery keeps the investigation open.
 */
export function notifyHelperResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'surviving-subprocesses') return;
    const work = store.state.workLog?.find(work => work.id === entry.source.id && work.requestId === entry.source.requestId);
    if (!work?.processId) return;
    const file = readOwnedSessionArtifact(store.dataRoot, work.id, 'process-lifecycle.json', 65536);
    if (!('text' in file)) return;
    let parsed: ReturnType<typeof LifecycleDiagnostic.safeParse>;
    try { parsed = LifecycleDiagnostic.safeParse(JSON.parse(file.text)); } catch { return; }
    if (!parsed.success || parsed.data.processGroup !== work.processId) return;
    const exit = parsed.data.snapshots.find(snapshot => snapshot.phase === 'exit');
    if (exit?.status !== 'observed' || exit.truncated || !exit.members.length || exit.members.some(member => member.executable !== NOTIFY_HELPER)) return;
    const deliveries = store.state.slackDeliveries?.filter(delivery => delivery.requestId === entry.source.requestId) || [];
    const confirmed = deliveries.find(delivery => delivery.status === 'confirmed' && slackMessageUrl(delivery.permalink, delivery.channelId, delivery.messageTs));
    if (!confirmed || deliveries.some(delivery => delivery.status !== 'confirmed')) return;
    return { kind: 'confirmed' as const, sourceId: confirmed.id, receipt: confirmed.permalink };
}
