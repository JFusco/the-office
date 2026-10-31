import { randomUUID } from 'node:crypto';
import { ingest } from './workflow';
import { type Ticket } from '../../src/shared';
import type { Engine } from '../scheduling/engine';

export function requestMail(this: Engine, scheduled = false) {
    if (this.store.state.paused)
        throw new Error('The office is paused');
    const prior = this.store.state.pendingMail;
    this.store.state.pendingMail = { scheduled: scheduled || !!prior?.scheduled, requestedAt: prior?.requestedAt || new Date().toISOString(), id: prior?.id || randomUUID() };
    // Intake is read-only. A deliberate new check supersedes the old read error,
    // but does not claim a successful mailbox observation until it completes.
    if (this.store.state.intake.status === 'blocked') {
        this.store.state.intake.status = 'idle';
        this.store.state.intake.error = '';
    }
    if (!prior)
        this.store.emit('mail-check-queued', 'Morgan will check the mailbox when the current ticket finishes.', 'pm');
    else
        this.store.save();
}

export async function drainMail(this: Engine) {
    const pending = this.store.state.pendingMail;
    if (!pending || this.store.state.paused || this.busy || this.agents.active.size || this.store.state.intake.status === 'working' || this.store.state.nightlyDispatching)
        return false;
    this.store.state.pendingMail = undefined;
    this.store.save();
    await this.checkMail(pending.scheduled);
    return true;
}

export async function checkMail(this: Engine, scheduled = false) {
    if (this.store.state.paused)
        throw new Error('The office is paused');
    if (this.store.state.intake.status === 'working')
        return;
    if (this.store.project.provider === 'github') {
        await this.github.poll();
        const g = this.store.state.github!;
        this.store.state.intake = { ...this.store.state.intake, status: g.error ? 'blocked' : 'idle', lastChecked: g.observedAt, error: g.error };
        this.store.save();
        return;
    }
    this.store.state.intake.status = 'working';
    this.store.state.intake.error = '';
    this.store.emit('mail-check', 'PM is checking the CEC mailbox', 'pm');
    try {
        const result = await this.agents.intake();
        if (!result.complete)
            throw new Error(result.blocker || 'Incomplete board pagination');
        ingest(this.store.state, result.tickets as Ticket[]);
        this.store.state.intake = { ...this.store.state.intake, status: 'idle', lastChecked: new Date().toISOString(), error: '' };
        this.store.emit('mail-delivered', result.tickets.length ? `${result.tickets.length} eligible ticket${result.tickets.length === 1 ? '' : 's'} delivered to the PM mailbox.` : 'No new tickets. Your CEC backlog has been checked.', 'pm');
        if (scheduled && this.store.state.nightlyEnabled)
            void this.dispatchNightly();
    }
    catch (e) {
        this.store.state.intake.status = 'blocked';
        this.store.state.intake.error = String(e);
        this.store.emit('mail-blocked', String(e), 'pm');
    }
}
