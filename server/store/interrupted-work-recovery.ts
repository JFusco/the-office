import { projectOutbox } from '../conversations/outbox';
import { ROLE_NAMES, workKey, type EffectIntent } from '../../src/shared';
import { durationLabel } from '../../src/timing/timing';
import type { Store } from './store';

export function recover(this: Store): void  {
    this.transaction(() => {
        const coordination = this.state.coordination;
        for (const run of this.state.maintenance?.runs || [])
            if (run.blockerFollowup?.status === 'working') {
                run.blockerFollowup.status = 'interrupted';
                run.blockerFollowup.detail = 'Source repair routing interrupted; read back original session and issue/card effects before continuing. No automatic replay.';
            }
        for (const n of coordination?.notices?.entries || [])
            if (n.status === 'working') {
                n.status = 'uncertain';
                n.detail = 'Notice interrupted; read back any saved Slack delivery before continuing. No automatic resend.';
            }
        for (const e of coordination?.time?.entries || [])
            if (e.status === 'posting') {
                e.status = 'uncertain';
                e.detail = 'Time update interrupted; read back the board before continuing. No automatic replay.';
            }
        for (const j of coordination?.jobs || [])
            if (j.status === 'working') {
                j.status = 'interrupted';
                j.detail = 'Delivery interrupted; read back original sessions and remote effects before continuing. No automatic replay.';
            }
        for (const c of coordination?.checkpoints || [])
            if (c.status === 'working') {
                const run = this.state.maintenance?.runs.find(run => run.id === c.runId);
                const activeOwnership = this.activeClaims().some(claim => [c.id, c.runId].includes(claim.work.id)) || this.state.workLog?.some(work => [c.id, c.runId].includes(work.requestId) && ['running', 'stopping'].includes(work.status));
                const uncertainEffect = run && this.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain')").get(workKey({ projectId: this.project.id, kind: 'maintenance', id: run.id }));
                if (run?.status === 'queued' && (!run.checkpointId || run.checkpointId === c.id) && !activeOwnership && !uncertainEffect && !run.steps.some(step => step.result.receipts.some(receipt => !receipt.verified || receipt.uncertain)) && !['working', 'interrupted'].includes(run.blockerFollowup?.status || ''))
                    continue;
                c.status = 'interrupted';
                c.endedAt = this.clock.now().toISOString();
                c.detail = 'Checkpoint interrupted; reconcile its original run before a new request. No automatic replay.';
            }
        for (const r of coordination?.listener.reviews || [])
            if (r.status === 'working') {
                r.status = 'interrupted';
                r.endedAt = this.clock.now().toISOString();
                r.detail = 'PM review interrupted. Its original session must be read back before reassignment.';
            }
        for (const w of this.state.workLog || [])
            if (['running', 'stopping'].includes(w.status)) {
                if (w.processId) {
                    try {
                        process.kill(-w.processId, 0);
                        w.status = 'stopping';
                        w.durationUncertain = true;
                        continue;
                    }
                    catch (error) {
                        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
                            w.status = 'stopping';
                            continue;
                        }
                    }
                }
                w.status = 'interrupted';
                w.endedAt = w.lastHeartbeatAt;
                w.durationUncertain = true;
                w.reportedAt = this.clock.now().toISOString();
                this.emit('work-time-reported', `${ROLE_NAMES[w.role]} reported at least ${durationLabel(w.elapsedMs)} for ${w.ticket || 'office work'} to Morgan. The session was interrupted.`, 'pm', w.ticket);
            }
        for (const d of this.state.slackDeliveries || [])
            if (d.status === 'sending' || d.status === 'verifying') {
                d.status = 'uncertain';
                d.sessionId ||= this.state.agents.find(a => a.id === 'pm')?.sessionId || '';
                d.error = 'Interrupted during Slack delivery. Read back the saved session and message; never resend automatically.';
                d.updatedAt = this.clock.now().toISOString();
            }
        for (const run of this.state.maintenance?.runs || [])
            if (run.status === 'working') {
                run.status = 'interrupted';
                run.error = 'Interrupted assignment; reconcile saved sessions and remote effects before requesting another maintenance run.';
                run.endedAt = this.clock.now().toISOString();
            }
        for (const r of this.state.deliveryQueue || [])
            if (r.status === 'working') {
                r.status = 'interrupted';
                r.error = 'Delivery interrupted; deliberately request live read-back before continuing. No automatic replay.';
                const t = this.state.tickets.find(t => t.key === r.key);
                if (t?.pilot) {
                    t.activity = 'blocked';
                    t.blocker = r.error;
                }
            }
        this.state.nightlyDispatching = false;
        for (const m of this.state.messages)
            if (m.status === 'working') {
                m.sessionId ||= this.state.agents.find(a => a.id === m.to)?.sessionId || '';
                m.status = 'interrupted';
                m.error = 'Session interrupted. Its saved session and any ticket changes must be read back before sending a new instruction. This message will not be replayed.';
            }
        for (const t of this.state.tickets)
            if (t.activity === 'working') {
                t.activity = 'blocked';
                t.blocker = 'Worker interrupted. Reconcile the previous stage and external effects before resuming.';
            }
        for (const a of this.state.agents)
            if (a.activity === 'working') {
                a.activity = 'disconnected';
                a.task = 'Previous session interrupted; reconciliation required';
            }
        if (this.state.intake.status === 'working') {
            this.state.intake.status = 'blocked';
            this.state.intake.error = 'Previous mail check was interrupted. Safe to check again (read-only).';
        }
        this.db.exec("UPDATE attempts SET status='interrupted' WHERE status='running'");
        this.save();
        for (const row of this.db.prepare("SELECT body FROM effects WHERE status='dispatching'").all() as {
            body: string;
        }[]) {
            const intent: EffectIntent = JSON.parse(row.body);
            intent.status = 'uncertain';
            intent.error = 'Interrupted after dispatch; independent read-back required.';
            this.putEffect(intent);
        }
        this.state.outbox = projectOutbox(this.state, this.clock.now());
        for (const request of this.state.coordination?.requests || [])
            if (request.status === 'working') {
                request.status = 'interrupted';
                request.detail = 'Operation interrupted; original effects require read-back before another claim';
            }
        for (const claim of this.activeClaims())
            this.finishClaim(claim.id, this.state.workLog?.some(work => work.status === 'stopping' && work.processId && (work.claimId ? work.claimId === claim.id : work.requestId === claim.work.id || claim.work.id === `ticket:${work.ticket}`)) ? 'stopping' : 'interrupted');
        for (const intent of this.state.coordination?.time?.publications || [])
            if (intent.status === 'dispatching')
                intent.status = 'uncertain';
    });
}
