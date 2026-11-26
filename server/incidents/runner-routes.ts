import { readDeclaredBody } from '../office/http/read-declared-body';
import { json } from '../office/http/responses';
import { sanitizeObject } from '../office/security';
import type { IncidentLedger } from './incident-ledger';
import { recordRunnerFailure, RUNNER_INCIDENT } from './record-runner-failure';
import { FAILURE_ID, FailureEvent, failureLine, HaltReport, type FailureAnswer, type HaltAnswer } from './runner-report';
import type { RunnerReports } from './runner-reports';

/** A runner report is small: a journal line is at most 4 096 bytes, a halt report less. */
export const REPORT_LIMIT = 16384;

export interface RunnerRouteContext {
    offices: { incidents: IncidentLedger; runnerReports?: RunnerReports };
    now?: () => Date;
}

const failure = (answer: FailureAnswer, status = 200) => json(sanitizeObject(answer), status);
const halt = (answer: HaltAnswer, status = 200) => json(sanitizeObject(answer), status);
const parse = (text: string) => { try { return JSON.parse(text) as unknown; } catch { return undefined; } };

/** The failure as the Office kept it: its receipt, absence, or an ID that belongs to something else. */
function readFailure(incidents: IncidentLedger, id: string): Response {
    const saved = incidents.event(id);
    if (!saved) return failure({ version: 1, resource: 'runner-failure', result: 'absent', eventId: id }, 404);
    if (saved.kind !== 'runner-failure' || saved.incident !== RUNNER_INCIDENT)
        return failure({ version: 1, resource: 'runner-failure', result: 'occupied', eventId: id, error: `Incident event ${id} is not a runner failure` }, 409);
    return failure({ version: 1, resource: 'runner-failure', result: 'present', receipt: { eventId: id, incidentId: saved.incident, digest: String(saved.body.digest), revision: Number(saved.body.revision) } });
}

async function writeFailure(req: Request, context: RunnerRouteContext): Promise<Response> {
    const body = await readDeclaredBody(req, REPORT_LIMIT);
    if (!body.ok) return json({ error: body.error }, body.status);
    const parsed = FailureEvent.safeParse(parse(body.text));
    if (!parsed.success) return json({ error: 'Expected one runner failure event' }, 400);
    try { failureLine(parsed.data); } catch (error) { return json({ error: (error as Error).message }, 400); }
    const result = recordRunnerFailure(context.offices.incidents, parsed.data, (context.now ?? (() => new Date()))());
    return result.status === 'occupied'
        ? failure({ version: 1, resource: 'runner-failure', result: 'occupied', eventId: parsed.data.id, error: result.reason }, 409)
        : failure({ version: 1, resource: 'runner-failure', result: result.status, receipt: result.receipt });
}

async function writeHalt(req: Request, reports: RunnerReports, context: RunnerRouteContext): Promise<Response> {
    const body = await readDeclaredBody(req, REPORT_LIMIT);
    if (!body.ok) return json({ error: body.error }, body.status);
    const parsed = HaltReport.safeParse(parse(body.text));
    if (!parsed.success) return json({ error: 'Expected one runner halt report' }, 400);
    const result = reports.recordHalt(parsed.data, (context.now ?? (() => new Date()))());
    return 'current' in result
        ? halt({ version: 1, resource: 'runner-halt', result: result.status, current: result.current }, 409)
        : halt({ version: 1, resource: 'runner-halt', result: result.status, report: result.report });
}

/**
 * `/api/incidents/runner/...`: what the Overseer runner reports. `failures` records a journaled
 * failure under its journal ID, and `failures/<id>` reads back what was kept; `halt` records the
 * runner's control condition, and reading it returns the latest. Reached through the service's
 * origin check, deployment fence and busy mark, like every incident write. Every answer names its
 * resource and result, so absence here is never mistaken for an Office without these routes.
 */
export async function runnerRoute(req: Request, url: URL, context: RunnerRouteContext): Promise<Response> {
    const { incidents, runnerReports } = context.offices, path = url.pathname.slice('/api/incidents/runner/'.length);
    if (path === 'failures') return req.method === 'POST' ? writeFailure(req, context) : json({ error: 'POST required' }, 405);
    if (path.startsWith('failures/')) {
        if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
        let id: string;
        try { id = decodeURIComponent(path.slice('failures/'.length)); }
        catch { return json({ error: 'Not a runner failure ID' }, 400); }
        return FAILURE_ID.test(id) ? readFailure(incidents, id) : json({ error: 'Not a runner failure ID' }, 400);
    }
    if (path === 'halt') {
        if (!runnerReports) return json({ error: 'This Office keeps no runner reports' }, 503);
        if (req.method === 'POST') return writeHalt(req, runnerReports, context);
        if (req.method !== 'GET') return json({ error: 'GET or POST required' }, 405);
        const saved = runnerReports.halt();
        return saved ? halt({ version: 1, resource: 'runner-halt', result: 'present', report: saved }) : halt({ version: 1, resource: 'runner-halt', result: 'absent' }, 404);
    }
    return json({ error: 'No such runner report' }, 404);
}
