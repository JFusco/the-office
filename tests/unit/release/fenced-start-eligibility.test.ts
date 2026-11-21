import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { DATA } from '../../../server/office/config';
import { PROJECTS, projectData } from '../../../server/office/projects';
import { snapshotGaps, snapshotStores, storesChangedSince } from '../../../server/release/snapshot-stores';
import { Offices } from '../../../server/scheduling/offices';

const projects = PROJECTS.map(project => ({ name: project.id, path: resolve(projectData(project), 'office.sqlite') }));
const ctx = { projects, databases: [...projects, { name: 'office-control', path: resolve(DATA, 'office-control.sqlite') }] };

/** What `server/index.ts` does once its listener is up, and its clean shutdown. */
const opened = (office: Offices) => { for (const { store } of office.entries.values()) store.emit('office-opened', `${store.project.name} office is open.`); return office; };
const stop = (office: Offices) => { office.dispose(); for (const { store } of office.entries.values()) store.close(); office.control.close(); };

/**
 * The real constructor and start order, against this test file's own data root. A release that
 * starts under a deployment's fence and admits nothing must leave every store comparing as
 * unchanged, or no failed activation that reached its stores could ever be rolled back.
 */
test('a release that only started under the fence leaves the stores eligible for rollback; any other write does not', async () => {
    // A store's first start creates its coordination record after the start-up migration ran, so the migration
    // completes that record on the second start. A store in service has been started more than once.
    stop(opened(new Offices()));
    const previous = opened(new Offices());
    previous.fence.acquire('deploy-token-0123456789', 'deploy-x');
    stop(previous);
    const before = JSON.parse(JSON.stringify(snapshotStores(ctx)));
    expect(snapshotGaps(before)).toEqual([]);

    const target = opened(new Offices());
    try {
        expect(target.fenced()).toBe(true);
        expect(storesChangedSince(ctx, before)).toEqual([]);
        for (let i = 0; i < 5; i++) { await target.pump(); await target.tick(); }
        expect(storesChangedSince(ctx, before)).toEqual([]);
    } finally { stop(target); }
    expect(storesChangedSince(ctx, before)).toEqual([]);

    // A second start is still only starts. A write no start makes is a change.
    const again = opened(new Offices()), { store } = again.get(projects[0].name);
    try {
        expect(storesChangedSince(ctx, before)).toEqual([]);
        store.state.paused = !store.state.paused; store.save();
        expect(storesChangedSince(ctx, before)).toEqual([`${projects[0].name}: its contents changed`]);
    } finally { stop(again); }
});
