import { expect, test } from 'vitest';
import { bindHandoff, legacyMaterialKey, materialKey, nextHandoffId, openHandoff, settleHandoffs, SOURCE_MISSING, supersededError, survivingHandoff, withoutProviderOccurrence, type HandoffEvidence } from '../../../server/knowledge/handoff-admission';
import { learningDigest } from '../../../server/knowledge/learning-events';
import { temporaryReadFailure } from '../../../server/scheduling/read-retries';
import type { BlockerFollowup, TeamMessage, WorkClaim, WorkTime } from '../../../src/shared';

const P = 'brain';
const footer = (id: string, at: string) => `HTTP 403: API rate limit exceeded for user ID 486049. If you reach out to GitHub Support for help, please include the request ID ${id} and timestamp ${at}.`;
const denied = 'HTTP 403: Resource not accessible by integration (permission denied) for /orgs/acme/projectsV2/7';
const message = (id: string, over: Partial<TeamMessage> = {}): TeamMessage => ({ id, requestId: id, from: 'knowledge', to: 'pm', ticket: '', actionId: 'harper:x', body: 'Harper requests READ ONLY diagnosis', status: 'queued', createdAt: '2026-11-24T14:00:00.000Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [], ...over });
const followup = (over: Partial<BlockerFollowup> = {}): BlockerFollowup => ({ id: 'recovery:assignment-listener', source: { kind: 'recovery', id: 'assignment-listener' }, key: '', fingerprint: '', owner: 'Morgan', nextAction: footer('A1:B2', '2026-11-24 14:00:00 UTC'), evidence: [], disposition: 'needs-input', createdAt: '', updatedAt: '', history: [], ...over });
const evidence = (messages: TeamMessage[], over: Partial<HandoffEvidence> = {}): HandoffEvidence => ({ projectId: P, messages, claims: [], workLog: [], unsettled: { workKeys: new Set(), attempts: new Set() }, ...over });
const claim = (id: string, status: WorkClaim['status'] = 'running'): WorkClaim => ({ id: `claim-${id}`, work: { projectId: P, kind: 'conversation', id }, owner: 'scheduler', stage: 'conversation:pm', lane: 'delivery', status, claimedAt: '', endedAt: '' });
const worker = (requestId: string, status: WorkTime['status'], ticket = ''): WorkTime => ({ id: `run-${requestId}`, requestId, ticket, status, role: 'pm', stage: 'conversation-readback' } as WorkTime);
/** A history entry as the recovery loop records it; `missing` is the synthetic source-loss observation. */
const seen = (status: 'retrying' | 'needs-human' | 'resolved' | 'missing', detail?: string, at = '2026-11-24T14:00:00.000Z', recorded = true): BlockerFollowup['history'][number] => status === 'missing'
    ? { at, disposition: 'unknown', fingerprint: learningDigest(['unknown', SOURCE_MISSING.proof, SOURCE_MISSING.detail]), detail: SOURCE_MISSING.detail }
    : { at, disposition: status === 'needs-human' ? 'needs-input' : status === 'retrying' ? 'unresolved' : 'unknown', fingerprint: learningDigest([status, detail, at]), ...(detail === undefined ? {} : { detail }), ...(recorded ? { ownerStatus: status } : {}) };
const key = (item: BlockerFollowup) => materialKey(item, item.nextAction, temporaryReadFailure);

test('provider occurrence metadata is removed; status codes, resources, later lines and instructions stay', () => {
    const one = footer('C8B2:369A92', '2026-11-24 13:36:36 UTC'), two = footer('D111:22AA:3BCD:9E', '2026-11-24 13:37:41 UTC');
    expect(withoutProviderOccurrence(one)).toBe(withoutProviderOccurrence(two));
    expect(withoutProviderOccurrence(one)).toBe('HTTP 403: API rate limit exceeded for user ID 486049. If you reach out to GitHub Support for help, please include the request ID <request-id> and timestamp <timestamp>.');
    expect(withoutProviderOccurrence(`${one}\nRead /repos/acme/site/issues/12 again after the reset.`)).toContain('\nRead /repos/acme/site/issues/12 again after the reset.');
    expect(withoutProviderOccurrence('X-GitHub-Request-Id: C8B2:369A92:1F\nHTTP 404 /repos/acme/site')).toBe('X-GitHub-Request-Id: <request-id>\nHTTP 404 /repos/acme/site');
    expect(withoutProviderOccurrence(denied)).toBe(denied);
    expect(withoutProviderOccurrence(footer('C8B2:369A92', '2026-11-24 13:36:36 UTC').replace('403', '429'))).not.toBe(withoutProviderOccurrence(one));
});

test('the survivor is the bound request in flight, then the current binding, then the last binding; queued unstarted siblings settle naming it', () => {
    const run = (over: Partial<BlockerFollowup>, messages: TeamMessage[], more: Partial<HandoffEvidence> = {}) => {
        const item = followup(over), settled = settleHandoffs([item], evidence(messages, more));
        return { item, settled, failed: messages.filter(m => m.status === 'failed').map(m => [m.id, m.supersededByHandoffId, m.error]) };
    };
    // An older working request outranks the newer queued current binding.
    let messages = [message('a'), message('b', { status: 'working' }), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'], handoffId: 'c' }, messages)).toMatchObject({ settled: 2, item: { handoffId: 'b' }, failed: [['a', 'b', supersededError('b')], ['c', 'b', supersededError('b')]] });
    // A queued request under an exact claim, or with its worker still stopping, is in flight; among several the current binding wins, then the last.
    messages = [message('a'), message('b'), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'], handoffId: 'c' }, messages, { claims: [claim('a')] })).toMatchObject({ item: { handoffId: 'a' }, settled: 2 });
    messages = [message('a'), message('b'), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'], handoffId: 'c' }, messages, { workLog: [worker('a', 'stopping'), worker('b', 'running')] })).toMatchObject({ item: { handoffId: 'b' } });
    messages = [message('a'), message('b'), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'], handoffId: 'a' }, messages, { claims: [claim('a'), claim('c', 'stopping')] })).toMatchObject({ item: { handoffId: 'a' } });
    // Otherwise the current binding, even finished; an item saved with historical bindings only keeps its last.
    messages = [message('a'), message('b', { status: 'answered' }), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'], handoffId: 'b' }, messages)).toMatchObject({ item: { handoffId: 'b' }, settled: 2 });
    messages = [message('a'), message('b'), message('c')];
    expect(run({ handoffIds: ['a', 'b', 'c'] }, messages)).toMatchObject({ item: { handoffId: 'c' }, settled: 2, failed: [['a', 'c', supersededError('c')], ['b', 'c', supersededError('c')]] });
    // A displaced current binding is kept among the historical ones.
    messages = [message('a', { status: 'working' }), message('b')];
    expect(run({ handoffIds: ['a'], handoffId: 'b' }, messages).item).toMatchObject({ handoffId: 'a', handoffIds: ['a', 'b'] });
});

test('every started, adopted or unbound request is protected from settlement', () => {
    const item = followup({ handoffIds: ['session', 'worker', 'receipt', 'reply', 'effect', 'attempt', 'human', 'it', 'survivor'], handoffId: 'survivor' });
    const messages = [message('session', { sessionId: 'native' }), message('worker'), message('receipt', { receipts: [{ id: 'r', action: 'GET', target: 't', verified: true, uncertain: false, detail: '' }] }), message('reply'),
        { ...message('reply'), id: 'reply-answer', from: 'pm' as const, status: 'answered' as const }, message('effect'), message('attempt'), message('human', { from: 'human' }), message('it', { from: 'it' }),
        message('lookalike'), message('survivor')];
    const settled = settleHandoffs([item], evidence(messages, { workLog: [worker('worker', 'interrupted')], unsettled: { workKeys: new Set([`${P}:conversation:effect`]), attempts: new Set(['attempt']) } }));
    expect(settled).toBe(0);
    expect(messages.every(m => m.status !== 'failed')).toBe(true);
    // A claim protects the request and makes it the survivor.
    const claimed = followup({ handoffIds: ['claimed', 'survivor'], handoffId: 'survivor' }), rows = [message('claimed'), message('survivor')];
    expect(settleHandoffs([claimed], evidence(rows, { claims: [claim('claimed')] }))).toBe(1);
    expect(claimed.handoffId).toBe('claimed'); expect(rows.map(m => m.status)).toEqual(['queued', 'failed']);
    // A settled request is not chosen again and stays settled after the survivor finishes.
    rows[0].status = 'answered';
    expect(settleHandoffs([claimed], evidence(rows))).toBe(0);
    expect(claimed.handoffId).toBe('claimed'); expect(rows[1]).toMatchObject({ status: 'failed', supersededByHandoffId: 'claimed' });
});

test('a hand-off is open while its current binding is queued or working or a bound request still executes; a worker sharing only the ticket is not one', () => {
    const item = followup({ handoffIds: ['old', 'it-request'], handoffId: 'current' }), base = () => [message('old', { status: 'interrupted' }), message('it-request', { from: 'it', status: 'failed' }), message('current', { status: 'answered' })];
    expect(openHandoff(item, evidence(base()))).toBe(false);
    for (const status of ['queued', 'working'] as const) expect(openHandoff(item, evidence(base().map(m => m.id === 'current' ? { ...m, status } : m)))).toBe(true);
    expect(openHandoff(item, evidence(base().map(m => m.id === 'old' ? { ...m, status: 'working' } : m)))).toBe(true);
    expect(openHandoff(item, evidence(base(), { claims: [claim('it-request', 'stopping')] }))).toBe(true);
    expect(openHandoff(item, evidence(base(), { workLog: [worker('old', 'stopping')] }))).toBe(true);
    expect(openHandoff(item, evidence(base(), { workLog: [worker('it-request', 'running')] }))).toBe(false);
    expect(openHandoff(item, evidence(base(), { workLog: [worker('unrelated', 'stopping', 'GH-12')] }))).toBe(false);
});

test('each admission gets a distinct id past every binding and saved id', () => {
    const item = followup({ handoffIds: ['harper-followup:recovery:assignment-listener:abc', 'x'] });
    expect(nextHandoffId(item, [])).toBe('harper-followup:recovery:assignment-listener:send-3');
    expect(nextHandoffId(item, [message('harper-followup:recovery:assignment-listener:send-3'), message('harper-followup:recovery:assignment-listener:send-4')])).toBe('harper-followup:recovery:assignment-listener:send-5');
    const bound = followup(); bindHandoff(bound, 'first'); bindHandoff(bound, 'second');
    expect(bound).toMatchObject({ handoffId: 'second', handoffIds: ['first'] });
});

test('a recovery is about its needs-human episode by history position, and the two IT reads also by failure category', () => {
    const t = '2026-11-24T14:00:00.000Z', one = footer('A1', '2026-11-24 14:00:00 UTC'), two = footer('B2', '2026-11-24 14:01:00 UTC');
    const at = (history: BlockerFollowup['history'], id = 'assignment-listener') => key(followup({ source: { kind: 'recovery', id }, history, nextAction: history.at(-1)!.detail! }));
    const first = at([seen('needs-human', one, t)]);
    // Provider ids and times change nothing; neither does a source that went missing and came back.
    expect(at([seen('needs-human', one, t), seen('needs-human', two, t)])).toBe(first);
    expect(at([seen('needs-human', one, t), seen('missing', undefined, t), seen('needs-human', one, t)])).toBe(first);
    // An observed exit and a return is a new episode, with identical text and one frozen time.
    expect(at([seen('needs-human', one, t), seen('retrying', one, t), seen('needs-human', one, t)])).not.toBe(first);
    expect(at([seen('needs-human', one, t), seen('resolved', one, t), seen('needs-human', one, t)])).not.toBe(first);
    // Entries saved before owner status was recorded read it from their disposition.
    expect(at([seen('needs-human', one, t, false), seen('resolved', one, t, false), seen('needs-human', one, t, false)])).not.toBe(at([seen('needs-human', one, t, false)]));
    // A category change within one episode is new for the two named reads only.
    expect(at([seen('needs-human', one, t), seen('needs-human', denied, t)])).not.toBe(first);
    expect(at([seen('needs-human', one, t), seen('needs-human', denied, t)], 'project-progress')).not.toBe(at([seen('needs-human', one, t)], 'project-progress'));
    expect(at([seen('needs-human', one, t), seen('needs-human', denied, t)], 'implementation:job-1')).toBe(at([seen('needs-human', one, t)], 'implementation:job-1'));
    // Any other follow-up is about its whole action, less the footer.
    const action = (nextAction: string) => key(followup({ id: 'maintenance:m', source: { kind: 'maintenance', id: 'm' }, nextAction }));
    expect(action(`Read back issue 7. ${one}`)).toBe(action(`Read back issue 7. ${two}`));
    expect(action(`Read back issue 8. ${one}`)).not.toBe(action(`Read back issue 7. ${one}`));
});

test('legacy hand-offs: an answer before a recorded exit leaves the current return due; ambiguity baselines the latest source-present material', () => {
    const D = footer('A1', '2026-11-24 14:00:00 UTC'), id = 'recovery:assignment-listener', old = `harper-followup:${id}:${learningDigest(D)}`;
    const at = (minute: number) => `2026-11-24T14:${String(minute).padStart(2, '0')}:00.000Z`;
    const legacy = (history: BlockerFollowup['history'], answeredAt?: string, createdAt = at(0)) => {
        const item = followup({ history, handoffId: old, nextAction: D }), request = message(old, { status: answeredAt ? 'answered' : 'queued', createdAt });
        const messages = answeredAt ? [request, { ...request, id: 'answer', from: 'pm' as const, status: 'answered' as const, createdAt: answeredAt }] : [request];
        return { item, legacy: legacyMaterialKey(item, messages, temporaryReadFailure), current: key(item) };
    };
    const proven = legacy([seen('needs-human', D, at(0), false), seen('retrying', D, at(3), false), seen('needs-human', D, at(4), false)], at(1));
    expect(proven.legacy).toBeDefined(); expect(proven.legacy).not.toBe(proven.current);
    // A tie, an answer after the exit, an open request, or no answer recorded: the current return is covered.
    expect(legacy([seen('needs-human', D, at(0), false), seen('retrying', D, at(0), false), seen('needs-human', D, at(0), false)], at(0)).legacy).toBe(proven.current);
    expect(legacy([seen('needs-human', D, at(0), false), seen('retrying', D, at(3), false), seen('needs-human', D, at(4), false)], at(3)).legacy).toBe(proven.current);
    expect(legacy([seen('needs-human', D, at(0), false), seen('retrying', D, at(3), false), seen('needs-human', D, at(4), false)]).legacy).toBe(proven.current);
    // Without detail the old id matches no observation.
    const omitted = legacy([seen('needs-human', undefined, at(0), false), seen('retrying', undefined, at(3), false), seen('needs-human', undefined, at(4), false)], at(1));
    expect(omitted.legacy).toBe(omitted.current);
    // A baseline at an observed exit covers the episode before it, so the next return is due.
    const exited = legacy([seen('needs-human', D, at(0), false), seen('retrying', D, at(3), false)]);
    const returned = followup({ history: [...exited.item.history, seen('needs-human', D, at(5))], nextAction: D });
    expect(exited.legacy).not.toBe(key(returned));
    expect(exited.legacy).toBe(key(followup({ history: [seen('needs-human', D, at(0), false)], nextAction: D })));
    // A source that went missing is not material: the baseline is the latest source-present observation.
    const missing = legacy([seen('needs-human', D, at(0), false), seen('missing', undefined, at(3))]);
    expect(missing.legacy).toBe(key(followup({ history: [seen('needs-human', D, at(0), false)], nextAction: D })));
    // No Harper request bound: nothing to baseline, the first send is due.
    expect(legacyMaterialKey(followup({ history: [seen('needs-human', D)], handoffId: 'it-readback' }), [message('it-readback', { from: 'it' })], temporaryReadFailure)).toBeUndefined();
    expect(survivingHandoff(followup({ handoffId: 'gone' }), evidence([]), new Map())).toBeUndefined();
});
