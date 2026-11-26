import { spawnCommand } from '../workers/spawn-command';
import { bindGitHubRunner, type Runner } from './call-scope';
import { CallLedger } from './call-ledger';
import { meteredRunner } from './metered-runner';
import { QuotaGovernor } from './quota-governor';
import { RateLimitSamples } from './rate-limit-samples';

/**
 * One Office instance's GitHub call accounting: its metered runner over the raw executor, the rolling hour of
 * calls by source, the account's sampled rate limits and the quota governor that reads them. Memory only.
 */
export class GitHubCalls {
    readonly ledger: CallLedger;
    readonly quota: RateLimitSamples;
    readonly governor: QuotaGovernor;
    readonly run: Runner;
    constructor(raw: Runner = spawnCommand, private serviceInstanceId = '', now = () => Date.now()) {
        this.ledger = new CallLedger(now);
        // The sample goes through the runner, so its own call is counted under `quota`.
        this.quota = new RateLimitSamples((...call) => this.run(...call), now);
        this.governor = new QuotaGovernor(this.quota, now);
        this.run = meteredRunner(raw, this.ledger, this.quota, this.governor);
    }
    /** Service work (an HTTP request, the timers) with this runner bound for `command('gh', …)`. */
    bind<T>(work: () => T): T { return bindGitHubRunner(this.run, work); }
    /** The `github` block of /api/health. Reads memory only: it never calls a provider. */
    report() { return { serviceInstanceId: this.serviceInstanceId, ...this.ledger.report(), quota: this.quota.report() }; }
}
