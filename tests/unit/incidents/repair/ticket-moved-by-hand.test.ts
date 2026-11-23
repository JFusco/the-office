import { expect, test } from 'vitest';
import { ticketMovedByHand } from '../../../../server/incidents/repair/ticket-moved-by-hand';
import type { DeliveryRequest } from '../../../../src/shared';

const T = (minute: number) => `2026-11-20T12:${String(minute).padStart(2, '0')}:00.000Z`;
const request = (id: string, minute: number, over: Partial<DeliveryRequest> = {}): DeliveryRequest => ({ id, key: 'CEC-1', action: 'resume-ticket', requestedAt: T(minute), status: 'completed', error: '', ...over });
const RESUME = request('resume', 5, { repairResume: {} as never });
const moved = (...later: DeliveryRequest[]) => ticketMovedByHand({ deliveryQueue: [request('before', 1, { operator: true }), RESUME, ...later] }, RESUME);

test('an operator\'s request for the ticket that follows the resume in the queue is a move by hand, named by its command', () => {
    expect(moved(request('op', 9, { operator: true }))).toEqual({ kind: 'resume-ticket', at: T(9) });
    expect(moved(request('op', 9, { operator: true, action: 'start-pilot' }))).toEqual({ kind: 'start-pilot', at: T(9) });
    expect(moved(request('retry', 9, { qaPlanRetry: {} as never }))).toEqual({ kind: 'continue-qa-plan', at: T(9) });
    expect(moved(request('saved', 9, { action: 'continue-saved-implementation', implementationContinuation: {} as never }))).toEqual({ kind: 'continue-saved-implementation', at: T(9) });
    // The first one, by the queue's order.
    expect(moved(request('auto', 6), request('op', 9, { operator: true }), request('retry', 10, { qaPlanRetry: {} as never }))).toEqual({ kind: 'resume-ticket', at: T(9) });
});

test('a request an automatic path queued, one for another ticket, one before the resume and the resume itself are not', () => {
    expect(moved()).toBeNull();
    expect(moved(request('auto', 9), request('handoff', 10, { officeQAHandoff: {} as never }), request('feature', 11, { featureBinding: {} as never }))).toBeNull();
    expect(moved(request('other', 9, { key: 'CEC-2', operator: true }))).toBeNull();
    // "After" is the queue's order, not the time on the request.
    expect(ticketMovedByHand({ deliveryQueue: [request('early', 30, { operator: true }), RESUME] }, RESUME)).toBeNull();
    expect(moved(request('late-in-queue', 1, { operator: true }))).toEqual({ kind: 'resume-ticket', at: T(1) });
    // A resume the queue no longer holds has nothing after it.
    expect(ticketMovedByHand({ deliveryQueue: [request('op', 9, { operator: true })] }, RESUME)).toBeNull();
    expect(ticketMovedByHand({}, RESUME)).toBeNull();
});
