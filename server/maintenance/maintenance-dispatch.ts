import type { Engine } from '../scheduling/engine';

export function requestMaintenance(this: Engine, scheduled = false) {
    if (this.store.project.provider !== 'github')
        throw new Error('Maintenance requires a GitHub project');
    return this.maintenance.request(scheduled);
}

export async function reconcileMaintenance(this: Engine, id: string) {
    if (this.store.state.paused || this.busy || this.agents.active.size)
        throw new Error('Project is paused or a worker is occupied');
    this.busy = true;
    try {
        return await this.maintenance.reconcile(id);
    }
    finally {
        this.busy = false;
    }
}

export async function drainMaintenance(this: Engine, selectedId?: string) {
    if (this.busy || this.agents.active.size || this.store.state.paused || !this.store.state.maintenance?.runs.some(r => r.status === 'queued' && (!selectedId || r.id === selectedId)))
        return;
    this.busy = true;
    try {
        await this.maintenance.pump(selectedId);
    }
    finally {
        this.busy = false;
    }
}
