import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Incident, SubjectFix } from '../../src/contracts/incidents';

export interface IncidentCommandIO {
    /** The Office's own address, such as `http://127.0.0.1:4318`. */
    base: string;
    request?: typeof fetch;
    log?: (line: string) => void;
    read?: (path: string) => string;
    newId?: () => string;
}

const USAGE = [
    'pnpm office incident status INCIDENT',
    'pnpm office incident start-repair INCIDENT --issue NUMBER --revision REVISION [--event ID]',
    'pnpm office incident bind-fix INCIDENT COMMIT|PR --revision REVISION (--bindings FILE | --no-route REASON) [--event ID]',
].join('\n');

const FLAGS = ['--issue', '--revision', '--event', '--bindings', '--no-route'];
/** A flag's value; undefined when the flag is absent. A flag given with no value, or followed by another flag, is an error. */
function option(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index < 0) return undefined;
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`);
    return value;
}
const whole = (value: string | undefined) => value && /^\d+$/.test(value) ? Number(value) : undefined;

/**
 * `pnpm office incident`: reads one incident, records that its repair started, or binds a fix to
 * it. The Office validates and records; this only sends. A write names the revision the person
 * read and carries an event ID, printed before it is sent, so a lost answer is retried with the
 * same ID and recorded once. Returns the exit code: zero only when the Office accepted.
 */
export async function incidentCommand(args: string[], { base, request = fetch, log = console.log, read = path => readFileSync(path, 'utf8'), newId = randomUUID }: IncidentCommandIO): Promise<number> {
    const [verb, id] = args, url = `${base}/api/incidents/${encodeURIComponent(id ?? '')}`;
    // Every flag is checked before an ID is minted or anything is sent.
    try { for (const flag of FLAGS) option(args, flag); } catch (error) { log(`${(error as Error).message}\n${USAGE}`); return 2; }
    const answer = async (response: Response) => { log(JSON.stringify(await response.json(), null, 2)); return response.ok ? 0 : 1; };
    if (verb === 'status' && id) return answer(await request(url));
    const revision = whole(option(args, '--revision')), suppliedEventId = option(args, '--event');
    const eventId = suppliedEventId ?? `cli-${newId()}`;
    const send = async (body: Record<string, unknown>) => {
        log(`Event ${eventId}: send it again with --event ${eventId} if no answer comes back`);
        return answer(await request(`${url}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, eventId, expectedRevision: revision }) }));
    };
    if (verb === 'start-repair' && id && revision) {
        const issue = whole(option(args, '--issue'));
        if (issue) return send({ kind: 'repair-started', issue });
    }
    if (verb === 'bind-fix' && id && revision && args[2] && !args[2].startsWith('--')) {
        const file = option(args, '--bindings'), reason = option(args, '--no-route');
        if (file && !reason) return send({ kind: 'fix-bound', reference: args[2], bindings: JSON.parse(read(file)) as SubjectFix[] });
        if (reason && !file) {
            const current = await request(url);
            if (!current.ok) return answer(current);
            const { incident } = await current.json() as { incident: Incident };
            // A retry uses the subjects bound by its saved event, even after a later repair starts.
            const savedFix = incident.fixes?.find(fix => fix.event === suppliedEventId);
            const subjects = savedFix?.bindings ?? incident.repair?.subjects ?? [];
            const bindings = subjects.map(({ subject, digest }) => ({ subject, digest, disposition: 'no-route', reason }));
            return send({ kind: 'fix-bound', reference: args[2], bindings });
        }
    }
    log(USAGE);
    return 2;
}
