import { errno, type GroupProbe } from './contract';

/** Unknown probes retain the existing conservative alive disposition, with their errno attached. */
export function probeProcessGroup(pid: number, kill: typeof process.kill = process.kill): GroupProbe {
    try { kill(-pid, 0); return { state: 'alive' }; }
    catch (error) { const code = errno(error); return { state: code === 'ESRCH' ? 'absent' : 'unknown', errno: code }; }
}
