import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LifecycleDiagnostic } from './contract';

/** A diagnostic artifact never becomes result.json, execution completion, or a delivery receipt. */
export function retainLifecycle(directory: string, input: unknown, write = writeFileSync): boolean {
    try {
        const body = JSON.stringify(LifecycleDiagnostic.parse(input));
        if (Buffer.byteLength(body) > 16384) return false;
        write(resolve(directory, 'process-lifecycle.json'), body, { mode: 0o600 }); return true;
    } catch { return false; }
}
