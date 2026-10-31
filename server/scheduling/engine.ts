import { JiraOperations } from '../cec/jira-operations';
import { randomUUID } from 'node:crypto';
import { Agents } from '../workers/agents';
import { officeCapacity, type OfficeCapacity } from '../office/projects';
import { GitHubMonitor } from '../github/github';
import { GitHubMaintenance } from '../maintenance/maintenance';
import { BrainMaintenance } from '../maintenance/brain/brain-maintenance';
import { AzureMonitor } from '../cec/azure';
import { Store } from '../store/store';
import { command } from '../workers/process';
import { requestMail, drainMail, checkMail } from '../cec/mailbox';
import { requestDelivery, drainDelivery, startPilot, enableNightly, dispatchNightly, resume } from '../cec/pilot-delivery';
import { requestMaintenance, reconcileMaintenance, drainMaintenance } from '../maintenance/maintenance-dispatch';
import { run } from '../cec/ticket-stage-runner';
import { observe } from './provider-observation';
export class Engine {
    slackIdentityContext: () => {
        targetId: string;
        workspaceId: string;
        permalink: string;
        confirmedAt: string;
    }[] = () => [];
    owner = randomUUID();
    jira: JiraOperations;
    agents: Agents;
    ctoAgents: Agents;
    itAgents: Agents;
    azure: AzureMonitor;
    github: GitHubMonitor;
    maintenance: GitHubMaintenance;
    private localBusy = false;
    get busy() { return this.localBusy || !!(this.capacity.lane && this.capacity.lane !== this.store.project.id); }
    set busy(value: boolean) {
        if (value && this.capacity.lane && this.capacity.lane !== this.store.project.id)
            throw new Error('Another project owns the worker lane');
        this.localBusy = value;
        if (value)
            this.capacity.lane = this.store.project.id;
        else if (this.capacity.lane === this.store.project.id)
            this.capacity.lane = '';
    }
    heartbeat: ReturnType<typeof setInterval> | undefined;
    constructor(public store: Store, public capacity: OfficeCapacity = officeCapacity(), ctoCapacity: OfficeCapacity = officeCapacity(), itCapacity: OfficeCapacity = officeCapacity()) { this.jira = new JiraOperations(store); this.itAgents = new Agents(store, command, itCapacity); this.ctoAgents = new Agents(store, command, ctoCapacity); this.agents = new Agents(store, command, capacity); this.azure = new AzureMonitor(store); this.github = new GitHubMonitor(store); this.maintenance = store.project.id === 'brain' ? new BrainMaintenance(store, this.agents) : new GitHubMaintenance(store, this.agents); }
    requestMail(scheduled = false) { return requestMail.call(this, scheduled); }
    async drainMail() { return drainMail.call(this); }
    async checkMail(scheduled = false) { return checkMail.call(this, scheduled); }
    requestDelivery(key: string, action: 'start-pilot' | 'resume-ticket', intakeStatus?: string) { return requestDelivery.call(this, key, action, intakeStatus); }
    async drainDelivery(selectedId?: string) { return drainDelivery.call(this, selectedId); }
    async startPilot(key: string, background = true, intakeStatus?: string) { return startPilot.call(this, key, background, intakeStatus); }
    enableNightly(authorization?: string) { return enableNightly.call(this, authorization); }
    async dispatchNightly() { return dispatchNightly.call(this); }
    async resume(key: string, background = true) { return resume.call(this, key, background); }
    requestMaintenance(scheduled = false) { return requestMaintenance.call(this, scheduled); }
    async reconcileMaintenance(id: string) { return reconcileMaintenance.call(this, id); }
    async drainMaintenance(selectedId?: string) { return drainMaintenance.call(this, selectedId); }
    pause() { this.store.state.paused = true; this.agents.pause(); this.ctoAgents.pause(); this.itAgents.pause(); this.store.emit('paused', 'Office paused. Running workers are stopping; external effects require reconciliation.'); }
    unpause() { this.store.state.paused = false; this.store.state.draining = false; this.store.emit('resumed', 'Office resumed. Existing blocked work remains available for deliberate reconciliation.'); }
    async run(key: string) { return run.call(this, key); }
    async observe() { return observe.call(this); }
}
