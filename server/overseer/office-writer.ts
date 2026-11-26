import { FailureAnswer, HaltAnswer, type FailureEvent, type HaltReport } from '../incidents/runner-report';
import { sanitize } from '../office/security';
import { RUNNER_DEFAULTS } from './config';
import { bodyWithin, officeReader, type HealthReading } from './office-client';

/**
 * What the runner reports to the Office, and how it reads back what was kept: four fixed paths
 * under `/api/incidents/runner/` (server/incidents/runner-routes.ts), plus `/api/health` for a
 * send's preflight. Every request follows no redirect, is bounded by the smaller of its timeout
 * and the time left in the pass's phase, and has its answer checked against the shared contract.
 * A `POST` is one request, never repeated here; only a `GET` whose connection was reset is tried
 * once more.
 */

/** A report that could not be read or sent: the Office could not be reached in time, or answered as these routes never do. */
export class OfficeWriteError extends Error {
    constructor(readonly kind: 'unreachable' | 'protocol', message: string) { super(message); }
}

export interface OfficeWriter {
    canStartRequest(): boolean;
    health(): Promise<HealthReading>;
    /** The failure as the Office kept it: `present`, `absent` or `occupied`. */
    readFailure(id: string): Promise<FailureAnswer>;
    /** One `POST`: `recorded`, `replayed` or `occupied`. */
    sendFailure(event: FailureEvent): Promise<FailureAnswer>;
    /** The Office's halt slot: `present` or `absent`. */
    readHalt(): Promise<HaltAnswer>;
    /** One `POST`: `recorded`, `replayed`, `stale` or `conflict`. */
    sendHalt(report: HaltReport): Promise<HaltAnswer>;
}

const ANSWER_LIMIT = 64 * 1024;
/** The least time a send may start with, well inside the pass's 6 s finalization reserve. */
export const SEND_WINDOW_MS = 1_000;
const RESET = new Set(['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET']);
const codeOf = (error: unknown) => String((error as { cause?: { code?: unknown } })?.cause?.code ?? (error as { code?: unknown })?.code ?? '');
const bounded = (text: string) => sanitize(text).slice(0, 500);

export function officeWriter(base: string, request: typeof fetch = fetch, limits: { requestTimeoutMs: number; maxResponseBytes: number } = RUNNER_DEFAULTS, remaining: () => number = () => Infinity): OfficeWriter {
    const requestTimeout = () => Math.floor(Math.min(limits.requestTimeoutMs, remaining()));
    const call = async (method: 'GET' | 'POST', path: string, body?: string): Promise<{ status: number; answer: unknown }> => {
        for (let attempt = 0; ; attempt++) {
            // AbortSignal.timeout takes whole milliseconds; the phase clock is fractional.
            const timeout = requestTimeout();
            if (!(timeout > 0)) throw new OfficeWriteError('unreachable', `${method} ${path} was not sent: the pass has no time left for it`);
            let response: Response;
            try {
                response = await request(`${base}${path}`, {
                    method, redirect: 'error', signal: AbortSignal.timeout(timeout),
                    ...(body === undefined ? {} : { body, headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) } }),
                });
            } catch (error) {
                if (method === 'GET' && attempt === 0 && RESET.has(codeOf(error))) continue;
                throw new OfficeWriteError('unreachable', bounded(`${method} ${path} could not reach the Office: ${error instanceof Error ? error.message : String(error)}`));
            }
            let text: string;
            try { text = await bodyWithin(response, ANSWER_LIMIT); }
            catch (error) { throw new OfficeWriteError('unreachable', bounded(`${method} ${path} answer could not be read: ${error instanceof Error ? error.message : String(error)}`)); }
            try { return { status: response.status, answer: JSON.parse(text) as unknown }; }
            catch { throw new OfficeWriteError('protocol', `${method} ${path} answered ${response.status} without JSON`); }
        }
    };
    const failure = async (method: 'GET' | 'POST', path: string, id: string, accept: Partial<Record<FailureAnswer['result'], number>>, body?: string) => {
        const { status, answer } = await call(method, path, body), parsed = FailureAnswer.safeParse(answer);
        const known = parsed.success && accept[parsed.data.result] === status && (('receipt' in parsed.data ? parsed.data.receipt.eventId : parsed.data.eventId) === id);
        // A generic 404 from an Office without these routes, or any other shape, is never taken for absence.
        if (!known) throw new OfficeWriteError('protocol', `${method} ${path} answered ${status}, not a runner failure answer`);
        return parsed.data;
    };
    const halt = async (method: 'GET' | 'POST', accept: Partial<Record<HaltAnswer['result'], number>>, body?: string) => {
        const { status, answer } = await call(method, '/api/incidents/runner/halt', body), parsed = HaltAnswer.safeParse(answer);
        if (!parsed.success || accept[parsed.data.result] !== status) throw new OfficeWriteError('protocol', `${method} /api/incidents/runner/halt answered ${status}, not a runner halt answer`);
        return parsed.data;
    };
    return {
        // A send needs a real window, not a sliver: a claim made with a millisecond left would be read back forever, never sent.
        canStartRequest: () => requestTimeout() >= SEND_WINDOW_MS,
        health: () => officeReader(base, request, limits, remaining).health(),
        readFailure: id => failure('GET', `/api/incidents/runner/failures/${encodeURIComponent(id)}`, id, { present: 200, absent: 404, occupied: 409 }),
        sendFailure: event => failure('POST', '/api/incidents/runner/failures', event.id, { recorded: 200, replayed: 200, occupied: 409 }, JSON.stringify(event)),
        readHalt: () => halt('GET', { present: 200, absent: 404 }),
        sendHalt: report => halt('POST', { recorded: 200, replayed: 200, stale: 409, conflict: 409 }, JSON.stringify(report)),
    };
}
