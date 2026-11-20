import { az, correlatedBuild } from '../cec/azure';
import { followProduction } from '../cec/production/follow-production';
import { observePipelines } from '../pipelines/observe-pipelines';
import { azurePipelines } from '../pipelines/azure-pipelines';
import { githubWorkflows } from '../pipelines/github-workflows';
import { azureBinding } from '../office/project-bindings';
import { command } from '../workers/process';
import { reconcileAndResumeParked } from '../cec/parking/resume-parked';
import type { Engine } from './engine';

export async function observe(this: Engine) {
    if (this.store.project.provider === 'github') {
        await this.github.poll();
        const github = this.store.state.github;
        // Workflows are grouped from the runs just read, so a failed read leaves the last pipelines in place.
        if (github?.status === 'idle' && !github.error)
            await observePipelines(this.store, known => githubWorkflows(this.store.project.repository, path => this.github.api(path), github.runs, known)).catch(() => undefined);
        return;
    }
    // Beside the PR and build read, never in its way: a pipeline read that fails keeps the last pipelines.
    const pipelines = observePipelines(this.store, async () => { const azure = azureBinding(this.store.project); return azurePipelines(azure, args => az(azure, args, true, 30000)); }).catch(() => undefined);
    await this.azure.poll();
    await pipelines;
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
            const deployment = this.store.state.azure.deployed.find(d => d.environment === azureBinding(this.store.project).deployment.environment);
            const build = this.store.state.azure.builds.find(b => b.id === deployment?.buildId);
            const fresh = deployment?.observedAt && Date.now() - Date.parse(deployment.observedAt) < 90000;
            if (p?.status === 'completed' && deployment?.healthy && fresh && deployment.commit && build?.result === 'succeeded') {
                try {
                    await command('git', ['merge-base', '--is-ancestor', t.commit, deployment.commit], { cwd: this.store.project.repo, timeout: 10000 });
                    t.stage = 'staging-qa';
                    t.blocker = '';
                    this.store.emit('staging-available', 'Candidate is included in the healthy running staging image; independent acceptance is starting.', 'qa', t.key);
                    this.store.save();
                }
                catch { /* Missing ancestry proof leaves the waiting state intact. */ }
            }
        }
    }
    // After the tickets above, whose staging check needs a fresh observation.
    { const azure = azureBinding(this.store.project); await followProduction(this.store, azure, { read: args => az(azure, args, true, 30000), write: args => az(azure, args) }, this.jira.execute); }
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
