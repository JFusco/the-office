import { createHash } from 'node:crypto';
import { lstatSync, realpathSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import type { Store } from '../store/store';
import type { HarnessRequest, WorkTime } from '../../src/shared';
import { processGroupAlive } from '../workers/process';
import { captureTime, timeLedger } from './time-accounting';
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const TimeClassificationInput = z.object({ workIds: z.array(z.string().uuid()).min(1).max(20).refine(ids => new Set(ids).size === ids.length), expectedSha256: z.string().regex(/^[a-f0-9]{64}$/), reason: z.literal('recovery-work-is-administrative') }).strict();
/** A stable preview identity excludes display labels while binding every measurement. */
export function timeClassificationDigest(work: WorkTime[]) {
    return digest([...work].sort((a, b) => a.id.localeCompare(b.id)).map(row => Object.fromEntries(['id', 'ticket', 'requestId', 'stage', 'role', 'provider', 'sessionId', 'status', 'startedAt', 'endedAt', 'effortKind', 'elapsedMs', 'segments', 'gaps', 'measurement'].map(key => [key, (row as any)[key] ?? null]))));
}
function artifact(store: Store, work: WorkTime, name: string) {
    const root = realpathSync(store.dataRoot), path = resolve(root, 'sessions', work.id, name);
    for (const item of [resolve(root, 'sessions'), resolve(root, 'sessions', work.id), path]) if (lstatSync(item).isSymbolicLink()) throw new Error('Classification proof cannot be a symlink');
    const info = lstatSync(path);
    if (!info.isFile() || info.size > 256000 || !realpathSync(path).startsWith(root + sep)) throw new Error('Classification proof is not a bounded owned file');
    const bytes = readFileSync(path, 'utf8'); return { path, sha256: createHash('sha256').update(bytes).digest('hex'), value: JSON.parse(bytes) };
}
/** Changes classification only; raw segments, duration, usage and prior provider receipts remain intact. */
export function correctRecoveryClassification(store: Store, request: HarnessRequest) {
    const input = TimeClassificationInput.parse(request.timeClassification), ids = new Set(input.workIds);
    const rows = (store.state.workLog || []).filter(work => ids.has(work.id));
    if (store.project.provider !== 'github' || store.state.paused || store.state.draining || rows.length !== ids.size) throw new Error('Current GitHub recovery measurements are required');
    if (rows.every(row => row.effortKind === 'administrative' && row.effortCorrection?.originalDigest === input.expectedSha256)) return;
    if (timeClassificationDigest(rows) !== input.expectedSha256) throw new Error('Recovery measurements changed; read them back');
    const proofs: { path: string; sha256: string }[] = [];
    for (const row of rows) {
        if (!['implementation-readback', 'discovery-readback'].includes(row.stage) || row.role !== 'lead' || row.provider !== 'codex' ||
            row.effortCorrection || row.effortKind !== 'substantive' || ['running', 'stopping'].includes(row.status) || !row.endedAt ||
            row.processId && processGroupAlive(row.processId)) throw new Error('Only stopped typed provider-reconciliation measurements may be corrected');
        const provider = artifact(store, row, 'provider.json'), assignment = artifact(store, row, 'assignment.json'), capabilities = artifact(store, row, 'capabilities.json');
        if (provider.value.project !== store.project.id || provider.value.repository !== store.project.repository || provider.value.role !== row.role || provider.value.provider !== row.provider || provider.value.readOnly !== true ||
            assignment.value.id !== row.id || assignment.value.role !== row.role || assignment.value.stage !== row.stage || assignment.value.work?.projectId !== store.project.id ||
            capabilities.value.name !== 'reader' || capabilities.value.readOnly !== true) throw new Error('Recovery classification provenance is incomplete');
        proofs.push(...[provider, assignment, capabilities].map(({ path, sha256 }) => ({ path, sha256 })));
    }
    const ledger = timeLedger(store), keys = new Set(rows.map(row => row.ticket));
    if (!ledger.enabled) throw new Error('Enable time accounting before correction');
    if (ledger.entries.some(entry => keys.has(entry.key) && entry.status === 'uncertain')) throw new Error('Reconcile uncertain time entries before correction');
    if ((ledger.publications || []).some(publication => keys.has(publication.key) && publication.status !== 'verified')) throw new Error('Reconcile pending or uncertain time publications before correction');
    const priorPublications = JSON.stringify(ledger.publications || []), prior = structuredClone(rows), priorEntries = structuredClone(ledger.entries.filter(entry => keys.has(entry.key))), at = store.clock.now().toISOString();
    const root = resolve(store.dataRoot, 'accounting-corrections'); mkdirSync(root, { recursive: true, mode: 0o700 });
    if (lstatSync(root).isSymbolicLink() || !realpathSync(root).startsWith(realpathSync(store.dataRoot) + sep)) throw new Error('Classification audit root is not owned');
    if (!/^[a-f0-9-]{36}$/.test(request.id)) throw new Error('Durable correction identity required');
    const path = resolve(root, `${request.id}.json`);
    writeFileSync(path, JSON.stringify({ requestId: request.id, input, prior, priorEntries, proofs, at, reason: 'Typed provider reconciliation is administrative, not substantive ticket effort. Raw measurements and prior publications retained.' }, null, 2), { mode: 0o600, flag: 'wx' });
    store.transaction(() => {
        if (store.state.paused || store.state.draining || !ledger.enabled || timeClassificationDigest(rows) !== input.expectedSha256 || JSON.stringify(ledger.publications || []) !== priorPublications) throw new Error('Classification state changed');
        for (const proof of proofs) if (lstatSync(proof.path).isSymbolicLink() || createHash('sha256').update(readFileSync(proof.path)).digest('hex') !== proof.sha256) throw new Error('Classification proof changed');
        for (const row of rows) {
            row.effortCorrection = { requestId: request.id, originalDigest: input.expectedSha256, originalKind: 'substantive', auditPath: path, at };
            row.effortKind = 'administrative';
        }
        // Rebuild affected totals from measurements; cached sourceIds can omit overlapping workers.
        for (const entry of ledger.entries) if (keys.has(entry.key)) {
            entry.seconds = 0; entry.sourceIds = [];
        }
        captureTime(store);
        for (const entry of ledger.entries) {
            const before = priorEntries.find(prior => prior.id === entry.id);
            if (!before) continue;
            entry.revision = (before.revision || 1) + (entry.seconds !== before.seconds ? 1 : 0);
            if (entry.seconds === before.seconds) {
                entry.status = before.status; entry.detail = before.detail;
            } else if (entry.seconds === 0) {
                entry.status = 'pending'; entry.detail = 'Administrative recovery only; zero confirmed substantive effort. Prior attempted publications retained for verified correction.';
            }
        }
        if (JSON.stringify(ledger.publications || []) !== priorPublications) throw new Error('Frozen publication history changed during classification');
        store.emit('time-classification-corrected', `Excluded ${rows.length} verified recovery sessions from ticket effort. Original measurements and publication receipts retained; corrected totals are queued for normal verified publication.`, 'pm');
    });
}
