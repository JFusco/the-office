import { unsettledEffects } from '../../operations/unsettled-effects';
import type { Store } from '../../store/store';
import type { DependabotAdoption, DependabotAlertIssue, TicketJob } from '../../../src/shared';

type Bot = NonNullable<DependabotAdoption['bot']> | 'dependabot';

/**
 * Bot adoption and alert work already under way, which a GitHub quota hold never defers: a record whose own work
 * started (`adopting`, `tracking`) or that owns an Effect still dispatching or uncertain, by its attempt identity
 * (the record ID), and an adopted PR whose delivery is live. A PR or alert without such a record is new intake.
 */
export function intakeUnderWay(store: Store, jobs: readonly TicketJob[]) {
    const { attempts } = unsettledEffects(store), coordination = store.state.coordination;
    const adoption = (record: DependabotAdoption) => record.status === 'adopting' || attempts.has(record.id);
    const delivering = (record: DependabotAdoption) => record.status === 'adopted' && !!record.issue
        && jobs.some(job => job.key === `GH-${record.issue}` && job.pr === record.pr && !['completed', 'cancelled'].includes(job.status));
    const alert = (record: DependabotAlertIssue) => record.status === 'tracking' || attempts.has(record.id);
    return {
        adoption, alert,
        /** This bot has an adoption under way, or an adopted PR to verify again on its live head. */
        bot: (bot: Bot) => (coordination?.adoptions ?? []).some(record => (record.bot || 'dependabot') === bot && (adoption(record) || delivering(record))),
        alerts: () => (coordination?.alertIssues ?? []).some(alert),
    };
}
