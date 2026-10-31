import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { Agents } from '../workers/agents';
import { DATA, CEC, HOLDS, LEGACY_AUTOMATION } from '../office/config';
import { eligibility, advance, resultGate } from './workflow';
import type { Engine } from '../scheduling/engine';

export function requestDelivery(this: Engine, key: string, action: 'start-pilot' | 'resume-ticket', intakeStatus?: string) {
    if (this.store.project.provider !== 'azure')
        throw new Error('GitHub issues use project chat and maintenance');
    const t = this.store.ticket(key), queue = this.store.state.deliveryQueue ??= [];
    const existing = queue.find(r => r.key === key && ['queued', 'working'].includes(r.status));
    if (existing)
        return existing;
    if (action === 'start-pilot') {
        const reason = eligibility(t, intakeStatus) || t.blocker;
        if (reason)
            throw new Error(reason);
        if (t.type === 'Epic')
            throw new Error('An Epic needs decomposition before implementation');
        if (t.stage !== 'mailbox')
            throw new Error('Use resume for existing work');
    }
    else if (!t.pilot || t.stage === 'complete')
        throw new Error('Ticket has no resumable delivery');
    const request = { id: randomUUID(), key, action, requestedAt: new Date(Math.max(this.store.clock.now().getTime(), Date.parse(queue.at(-1)?.requestedAt || '') + 1 || 0)).toISOString(), status: 'queued' as const, error: '', intakeStatus };
    queue.push(request);
    this.store.emit('delivery-queued', `${key} queued for ${action === 'start-pilot' ? 'implementation' : 'live read-back and resume'}.`, 'pm', key);
    return request;
}

export async function drainDelivery(this: Engine, selectedId?: string) {
    if (this.busy || this.agents.active.size || this.store.state.paused)
        return;
    const request = this.store.state.deliveryQueue?.find(r => r.status === 'queued' && (!selectedId || r.id === selectedId));
    if (!request)
        return;
    request.status = 'working';
    this.store.emit('delivery-started', `${request.key} is leaving the implementation queue.`, 'pm', request.key);
    try {
        if (request.action === 'start-pilot')
            await this.startPilot(request.key, false, request.intakeStatus);
        else
            await this.resume(request.key, false);
        request.status = this.store.ticket(request.key).activity === 'blocked' ? 'blocked' : 'completed';
        if (request.status === 'blocked')
            request.error = this.store.ticket(request.key).blocker;
    }
    catch (e) {
        request.status = 'blocked';
        request.error = String(e);
        const t = this.store.ticket(request.key);
        t.activity = 'blocked';
        t.blocker = request.error;
    }
    this.store.emit('delivery-request-finished', request.error || `${request.key} delivery request processed; see the ticket for its current stage.`, 'pm', request.key);
}

export async function startPilot(this: Engine, key: string, background = true, intakeStatus?: string) {
    if (this.store.project.provider === 'github')
        throw new Error('CMS issues are coordinated through project chat and the reviewed maintenance workflow');
    if (this.agents.active.size)
        throw new Error('Another assignment owns the worker desks');
    if (this.busy)
        throw new Error('Another ticket owns the implementation/browser pipeline');
    if (this.store.state.paused)
        throw new Error('Resume the office first');
    const t = this.store.ticket(key);
    const reason = eligibility(t, intakeStatus) || HOLDS[key];
    if (reason)
        throw new Error(reason);
    if (t.type === 'Epic')
        throw new Error('An Epic needs decomposition before implementation');
    if (t.stage !== 'mailbox')
        throw new Error('Use resume for existing work; do not start a duplicate pilot');
    this.busy = true;
    let live: Awaited<ReturnType<Agents['readback']>>;
    try {
        live = await this.agents.readback(key);
    }
    finally {
        this.busy = false;
    }
    const liveReason = eligibility({ ...live, key }, intakeStatus);
    if (liveReason || live.blocker || live.existingOwner || live.existingPrId)
        throw new Error(liveReason || live.blocker || `Existing owner/PR ${live.existingOwner || live.existingPrId} requires reconciliation before adoption`);
    t.pilot = true;
    t.runId = `${key.toLowerCase()}-${randomUUID()}`;
    t.stage = 'understand';
    t.activity = 'waiting';
    this.store.state.pilotKey = key;
    this.store.emit('pilot-started', `Selected ${key} for the end-to-end pilot`, 'pm', key); // The scheduler claims the first delivery stage on its next turn.
}

export function enableNightly(this: Engine, authorization?: string) {
    if (this.store.project.provider === 'github')
        throw new Error('Use the combined CMS maintenance entrypoint');
    const pilot = this.store.state.tickets.find(t => t.pilot && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed');
    const directed = authorization === 'user-directed-handover-2026-10-27';
    if (!pilot && !directed)
        throw new Error('Nightly dispatch requires a completed real ticket pilot with staging QA acceptance');
    const automation = readFileSync(LEGACY_AUTOMATION, 'utf8');
    if (!automation.includes('office intake --scheduled') && !automation.includes('server/cli.ts intake --scheduled'))
        throw new Error('Update the existing automation to the office entrypoint first; the legacy dispatcher still owns scheduling');
    this.store.state.nightlyEnabled = true;
    this.store.state.nightlyActivationReason = directed ? 'Joe explicitly requested immediate handover on 2026-10-27; live pilot remains unverified.' : `Verified pilot ${pilot!.key}`;
    this.store.emit('nightly-enabled', 'The nightly schedule now delivers tickets to this office.', 'pm');
}

export async function dispatchNightly(this: Engine) {
    if (this.busy || this.store.state.paused || this.store.state.nightlyDispatching)
        return;
    this.store.state.nightlyDispatching = true;
    this.store.save();
    try {
        for (const ticket of this.store.state.tickets) {
            if (this.store.state.paused)
                break;
            if (ticket.stage !== 'mailbox' || ticket.blocker || eligibility(ticket))
                continue;
            try {
                this.requestDelivery(ticket.key, 'start-pilot');
            }
            catch (e) {
                ticket.activity = 'blocked';
                ticket.blocker = String(e);
                this.store.emit('nightly-skipped', ticket.blocker, 'pm', ticket.key);
            }
        }
    }
    finally {
        this.store.state.nightlyDispatching = false;
        this.store.save();
    }
    this.store.emit('nightly-closeout', `Nightly intake queued: ${this.store.state.tickets.filter(t => t.stage === 'ready-for-staging').length} ready for staging, ${this.store.state.tickets.filter(t => t.activity === 'blocked').length} blocked; remaining work and evidence retained.`, 'pm');
}

export async function resume(this: Engine, key: string, background = true) {
    if (this.store.project.provider === 'github')
        throw new Error('Use CMS project chat to reconcile an issue; CEC delivery stages do not apply');
    if (this.agents.active.size)
        throw new Error('Another assignment owns the worker desks');
    const t = this.store.ticket(key);
    if (!t.pilot)
        throw new Error('Ticket has not been selected for a pilot');
    if (t.parked?.published && !t.parked.resumeRequestedAt)
        throw new Error(`Parked in Jira Blocked for a decision; move it back to ${t.parked.fromStatus} to resume`);
    if (this.store.state.paused || this.busy)
        throw new Error('Office is paused or pipeline is occupied');
    this.busy = true;
    let live: Awaited<ReturnType<Agents['readback']>>;
    try {
        live = await this.agents.readback(key);
    }
    finally {
        this.busy = false;
    }
    if (live.assignee !== CEC.account || live.subtask || !live.boardMember || live.blocker || HOLDS[key] || live.existingOwner)
        throw new Error(live.blocker || HOLDS[key] || 'Ownership/eligibility requires attention');
    if (live.existingPrId && live.existingPrId !== t.prId)
        throw new Error('A different PR exists; resolve duplicate work before resuming');
    if (/interrupted|timed out|uncertain|reconcil/i.test(t.blocker) || t.results[t.stage]?.receipts.some(x => x.uncertain)) {
        const observed = await this.agents.reconcile(t);
        const gap = resultGate(t, t.stage, observed, resolve(DATA, 'runs', t.runId));
        if (gap) {
            t.blocker = `Reconciliation incomplete: ${gap}`;
            t.activity = 'blocked';
            this.store.emit('reconcile-blocked', t.blocker, 'pm', key);
            throw new Error(t.blocker);
        }
        advance(t, t.stage, observed);
        this.store.emit('reconciled', 'Previous stage independently verified through read-back; no external action replayed.', 'pm', key);
    }
    t.activity = 'waiting';
    t.blocker = '';
    if (t.parked?.resumeRequestedAt)
        t.resolvedDecision = { marker: t.parked.marker, reason: t.parked.reason, status: t.parked.fromStatus, at: t.parked.resumeRequestedAt };
    delete t.parked;
    this.store.emit('ticket-resumed', 'Ticket resumed after live reconciliation', 'pm', key); // Reconciliation releases capacity; the scheduler claims the next stage.
}
