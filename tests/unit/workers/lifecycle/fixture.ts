import type { LifecycleDiagnostic } from '../../../../server/workers/lifecycle/contract';
export const at = '2026-11-08T14:00:00.000Z';
export const row = (pid = 101, pgid = 100) => `${pid} 100 ${pgid} Sun Nov 8 14:00:00 2026 /usr/local/bin/node`;
export const diagnostic = (): LifecycleDiagnostic => ({ version: 1, processGroup: 100, providerTerminalObserved: true, outcome: 'failed', failureCategory: 'uncertain-effect', probeCount: 2, omittedEvents: 0,
    events: [{ at, phase: 'exit', code: 0, signal: null }, { at, phase: 'probe', state: 'unknown', errno: 'EPERM' }],
    snapshots: [{ at, phase: 'exit', status: 'observed', truncated: false, members: [{ pid: 101, ppid: 100, pgid: 100, startIdentity: 'Sun Nov 8 14:00:00 2026', executable: 'node' }] }] });
