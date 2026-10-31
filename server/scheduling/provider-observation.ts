import { correlatedBuild } from '../cec/azure';
import { CEC } from '../office/config';
import { command } from '../workers/process';
import { reconcileAndResumeParked } from '../cec/parking/resume-parked';
import type { Engine } from './engine';

export async function observe(this: Engine) {
    if (this.store.project.provider === 'github') {
        await this.github.poll();
        return;
    }
    await this.azure.poll();
    if (this.store.state.paused || this.busy)
        return;
    await observeParked(this);
    for (const t of this.store.state.tickets) {
        if (!t.pilot)
            continue;
        if (t.stage === 'ci' && t.activity === 'waiting') {
            const p = this.store.state.azure.prs.find(p => p.id === t.prId);
            if (p && (correlatedBuild(p, this.store.state.azure.builds) || p.policies.some(p => p.buildId > 0 && ['rejected', 'broken'].includes(p.status)))) {
                t.blocker = '';
                this.store.save();
            }
        }
        if (t.stage === 'ready-for-staging' && t.results['ready-for-staging']?.outcome === 'passed' && t.activity === 'waiting') {
            const p = this.store.state.azure.prs.find(p => p.id === t.prId);
            const deployment = this.store.state.azure.deployed.find(d => d.environment === 'staging');
            const build = this.store.state.azure.builds.find(b => b.id === deployment?.buildId);
            const fresh = deployment?.observedAt && Date.now() - Date.parse(deployment.observedAt) < 90000;
            if (p?.status === 'completed' && deployment?.healthy && fresh && deployment.commit && build?.result === 'succeeded') {
                try {
                    await command('git', ['merge-base', '--is-ancestor', t.commit, deployment.commit], { cwd: CEC.repo, timeout: 10000 });
                    t.stage = 'staging-qa';
                    t.blocker = '';
                    this.store.emit('staging-available', 'Candidate is included in the healthy running staging image; independent acceptance is starting.', 'qa', t.key);
                    this.store.save();
                }
                catch { /* Missing ancestry proof leaves the waiting state intact. */ }
            }
        }
    }
}

const parkedReadError = new WeakMap<object, string>();
/** Parked Jira tickets: read-back of unconfirmed parking writes and resume once moved back. Failures retry next minute. */
async function observeParked(engine: Engine) {
    try {
        await reconcileAndResumeParked(engine.store, engine.jira.execute, key => engine.requestDelivery(key, 'resume-ticket'));
        parkedReadError.delete(engine.store);
    }
    catch (error) {
        const detail = `Parked Jira tickets could not be checked: ${String(error)}`;
        if (parkedReadError.get(engine.store) !== detail)
            engine.store.emit('jira-parked-poll-failed', detail, 'pm');
        parkedReadError.set(engine.store, detail);
    }
}
