import { LifecycleDiagnostic } from './contract';

/** Narrow read-back for Ellis; strip unknown fields and keep the investigation packet small. */
export function lifecycleFacts(input: unknown) {
    const parsed = LifecycleDiagnostic.safeParse(input); if (!parsed.success) return;
    const d = parsed.data;
    return { ...d, events: d.events.slice(-12), snapshots: d.snapshots.map(s => ({ ...s, omittedMembers: Math.max(0, s.members.length - 4), members: s.members.slice(0, 4) })) };
}
