import { z } from 'zod';
import { INCIDENT_SOURCES, type IncidentSource, type IncidentState } from '../../src/contracts/incidents';
import { sanitize } from '../office/security';
import { ServiceHealth } from '../release/service-http';
import { RUNNER_DEFAULTS } from './config';

/**
 * What the runner reads from the running Office, and nothing else: `/api/health` and the
 * research list. Every request is a body-less `GET` to a fixed path that follows no redirect,
 * is bounded in time and size, and is retried once only when its connection was reset.
 */

const STATES = ['observed', 'triaged', 'fixing', 'shipped', 'deployed', 'verified', 'recurred', 'housekept', 'dismissed', 'needs-joe', 'abandoned'] as const satisfies readonly IncidentState[];
// Fails to compile if the contract gains a state this list lacks.
const everyState: [Exclude<IncidentState, (typeof STATES)[number]>] extends [never] ? true : never = true;
void everyState;

export interface HealthReading {
    serviceInstanceId: string;
    loadedHash: string;
    pid: number;
    busy: boolean;
    fence: 'open' | 'held' | 'invalid';
    release: { status: string; commit?: string } | null;
}

/** One research-list row: the fields selection needs, taken from `src/contracts/incidents.ts`. */
export interface IncidentRow {
    id: string;
    state: IncidentState;
    revision: number;
    source: IncidentSource;
    researchEligible: boolean;
    researchAt: string | null;
    openSubjects: number;
}

const Row = z.object({
    id: z.string().regex(/^inc-[0-9a-f]{16}$/),
    state: z.enum(STATES),
    revision: z.number().int().min(0),
    cause: z.object({ source: z.enum(INCIDENT_SOURCES as [IncidentSource, ...IncidentSource[]]) }),
    research: z.object({ eligible: z.boolean(), at: z.iso.datetime().nullable() }),
    subjects: z.array(z.object({ status: z.enum(['open', 'cleared']) })),
});
const Envelope = z.object({ incidents: z.array(Row) });
const Release = z.object({ status: z.string().min(1).max(100), commit: z.string().max(100).optional() });

export interface OfficeReader {
    health(): Promise<HealthReading>;
    researchIncidents(): Promise<IncidentRow[]>;
}

/** A read of the Office that did not give a usable answer. */
export class OfficeReadError extends Error {}

const RESET = new Set(['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET']);
const reset = (error: unknown) => {
    const cause = (error as { cause?: { code?: unknown } })?.cause;
    return RESET.has(String(cause?.code ?? (error as { code?: unknown })?.code ?? ''));
};
const bounded = (text: string) => sanitize(text).slice(0, 500);

async function bodyWithin(response: Response, limit: number): Promise<string> {
    const declared = response.headers.get('content-length');
    if (declared !== null && Number(declared) > limit) {
        await response.body?.cancel().catch(() => undefined);
        throw new OfficeReadError(`The Office answered ${declared} bytes, more than ${limit}`);
    }
    const reader = response.body?.getReader();
    if (!reader) return '';
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > limit) {
            await reader.cancel().catch(() => undefined);
            throw new OfficeReadError(`The Office answered more than ${limit} bytes`);
        }
        chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
}

export function officeReader(base: string, request: typeof fetch = fetch, limits: { requestTimeoutMs: number; maxResponseBytes: number } = RUNNER_DEFAULTS): OfficeReader {
    const get = async (path: '/api/health' | '/api/incidents?research=1'): Promise<unknown> => {
        for (let attempt = 0; ; attempt++) {
            try {
                // The signal stays on the response, so it bounds reading the body as well.
                const response = await request(`${base}${path}`, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(limits.requestTimeoutMs) });
                const text = await bodyWithin(response, limits.maxResponseBytes);
                if (!response.ok) throw new OfficeReadError(bounded(`${path} answered ${response.status}: ${text.slice(0, 300)}`));
                try { return JSON.parse(text); }
                catch { throw new OfficeReadError(`${path} did not answer JSON`); }
            } catch (error) {
                if (error instanceof OfficeReadError) throw error;
                if (attempt === 0 && reset(error)) continue;
                const cause = (error as { cause?: { code?: unknown } })?.cause?.code;
                throw new OfficeReadError(bounded(`${path} could not be read: ${error instanceof Error ? error.message : String(error)}${cause ? ` (${String(cause)})` : ''}`));
            }
        }
    };
    return {
        async health() {
            const raw = await get('/api/health'), parsed = ServiceHealth.safeParse(raw);
            if (!parsed.success) throw new OfficeReadError('/api/health did not answer as an Office with a deployment fence');
            const release = Release.safeParse((raw as { release?: unknown }).release);
            const { serviceInstanceId, loadedHash, pid, busy, fence } = parsed.data;
            return { serviceInstanceId, loadedHash, pid, busy, fence: fence.status, release: release.success ? release.data : null };
        },
        async researchIncidents() {
            const parsed = Envelope.safeParse(await get('/api/incidents?research=1'));
            if (!parsed.success) throw new OfficeReadError('/api/incidents?research=1 did not answer a valid incident list');
            return parsed.data.incidents.map(row => ({
                id: row.id, state: row.state, revision: row.revision, source: row.cause.source,
                researchEligible: row.research.eligible, researchAt: row.research.at,
                openSubjects: row.subjects.filter(subject => subject.status === 'open').length,
            }));
        },
    };
}
