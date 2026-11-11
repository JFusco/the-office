import { retainEvidence } from './evidence-record';
import { z } from 'zod';
import { digest } from '../digest';
import type { SourceLedger } from './ledger';
import type { SourceUnit } from './source-unit';
import { command } from '../../workers/process';
import { projectById } from '../../office/projects';

export const ScanReceipt = z.object({ version: z.literal(1), inputSha256: z.string().regex(/^[a-f0-9]{64}$/),
    scannerVersion: z.string().min(1), policyVersion: z.string().min(1), clean: z.boolean(),
    findings: z.array(z.object({ rule: z.string(), line: z.number().int().positive(), endLine: z.number().int().positive() }).strict()).max(10000),
}).strict();
export type SecretScanner = (text: string) => Promise<z.infer<typeof ScanReceipt>>;
export async function scanText(text: string, execute = command): Promise<z.infer<typeof ScanReceipt>> {
    if (Buffer.byteLength(text) > 1024 * 1024) throw Error('Source text exceeds scanner limit');
    const raw = await execute('node', ['scripts/brain.mjs', 'scan', '--stdin', '--secrets-only'], { cwd: projectById('brain').repo, input: text, readOnly: true, timeout: 300000 });
    if (Buffer.byteLength(raw) > 1024 * 1024) throw Error('Scanner receipt exceeds limit');
    return checkedReceipt(text, JSON.parse(raw));
}
export function checkedReceipt(text: string, result: unknown): z.infer<typeof ScanReceipt> {
    const receipt = ScanReceipt.parse(result);
    if (receipt.inputSha256 !== digest(text) || receipt.clean !== (receipt.findings.length === 0)) throw Error('Invalid scanner receipt');
    return receipt;
}
/** Raw acquisition is retained privately; only verified clean bytes enter downstream evidence. */
export async function admitUnits(ledger: SourceLedger, units: SourceUnit[], scan: SecretScanner, eligible = () => true): Promise<void> {
    for (const unit of units) {
        const key = `${unit.id}:${unit.version}`;
        try {
            const receipt = checkedReceipt(unit.text, await scan(unit.text));
            const allowed = eligible();
            ledger.put('admission', key, { sourceId: ledger.source.id, unit: key, version: unit.version, receipt, state: !allowed ? 'held' : receipt.clean ? 'admitted' : 'blocked', at: ledger.store.clock.now().toISOString() });
            if (!allowed) throw Error('Source authority changed before admission');
            if (!receipt.clean) {
                const retained=ledger.get<SourceUnit>('unit',key);
                if(retained)ledger.put('unit',key,{...retained,state:'inaccessible',reason:'secret-scan-blocked'});
                continue;
            }
            retainEvidence(ledger, unit);
        } catch (error) {
            if (!ledger.get('admission', key)) ledger.put('admission', key, { sourceId: ledger.source.id, unit: key, state: 'scan-unavailable', at: ledger.store.clock.now().toISOString() });
            throw error;
        }
    }
}
