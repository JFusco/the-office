import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import type { HumanAction } from '../../../src/shared';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { incidentNotices, isNotice, readNotices } from '../../../server/incidents/incident-notices';
import { recordRunnerFailure, RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import type { HaltReport } from '../../../server/incidents/runner-report';
import { RunnerReports } from '../../../server/incidents/runner-reports';
import { outboxItems } from '../../../server/incidents/sources/outbox-items';
import type { Store } from '../../../server/store/store';
import { failure } from '../overseer/forward-world';
import { observe, projectStore } from './incident-fixture';

// The outbox collector reads the project's own projection: here it is made to hold both notice
// kinds still open, beside an item no other collector reads, as the positive control.
const served = vi.hoisted(() => ({ items: [] as HumanAction[] }));
vi.mock('../../../server/conversations/outbox', async original => ({ ...await original<object>(), projectOutbox: () => served.items }));

const dbs: DatabaseSync[] = [], stores: Store[] = [];
afterEach(() => { dbs.splice(0).forEach(db => db.close()); stores.splice(0).forEach(store => store.close()); served.items = []; });
const AT = new Date('2026-11-26T12:00:00.000Z');
const halt = (over: Partial<HaltReport>): HaltReport => ({ version: 1, sequence: 1, kind: 'running', control: null, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z', ...over });
const control = () => { const db = new DatabaseSync(':memory:'); dbs.push(db); return { incidents: new IncidentLedger(db), runnerReports: new RunnerReports(db) }; };

test('an open runner outage and a stopped runner are notices with owner steps; a paused or running runner and a cleared outage are not', () => {
    const offices = control(), down = failure('service-down');
    expect(readNotices(offices)).toEqual([]);
    recordRunnerFailure(offices.incidents, down, AT);
    offices.runnerReports.recordHalt(halt({ sequence: 1, kind: 'stopped', control: 'STOP.json', reason: 'STOP: journal damaged', since: '2026-11-26T11:59:00.000Z' }), AT);
    const notices = readNotices(offices);
    expect(notices.map(notice => notice.id)).toEqual([`overseer-incident:${RUNNER_INCIDENT}`, 'overseer-stopped']);
    for (const notice of notices) {
        expect(notice).toMatchObject({ role: 'it', status: 'open', ticket: '', url: '', ownerSteps: { steps: expect.arrayContaining([{ text: 'Read what the Overseer runner reports', run: 'pnpm office overseer status' }]) } });
        expect(isNotice(notice.id)).toBe(true);
    }
    expect(notices[1].ownerSteps!.steps.map(step => step.text).join(' ')).toContain('control/STOP.json');
    // The restoration clears the outage notice; a later running report clears the stop.
    recordRunnerFailure(offices.incidents, failure('service-restored', down.episode), AT);
    offices.runnerReports.recordHalt(halt({ sequence: 2, kind: 'paused', control: 'pause.json', reason: 'Paused: by Joe', since: '2026-11-26T12:00:00.000Z' }), AT);
    expect(readNotices(offices)).toEqual([]);
});

test('an unreadable pause file is a stop that names pause.json and has no known time', () => {
    const [notice] = incidentNotices(null, halt({ kind: 'stopped', control: 'pause.json', reason: '/runner/control/pause.json cannot be read (not a valid record)', since: null }));
    expect(notice).toMatchObject({ id: 'overseer-stopped', createdAt: '2026-11-26T12:00:00.000Z' });
    expect(notice.ownerSteps!.steps.map(step => step.text).join(' ')).toContain('control/pause.json');
});

test('the outbox collector never turns a notice into an incident of its own, while an uncovered item still is one', () => {
    const s = projectStore(); stores.push(s);
    const open = (id: string, title: string): HumanAction => ({ id, title, detail: 'd', role: 'it', ticket: '', url: '', status: 'open', createdAt: AT.toISOString(), updatedAt: AT.toISOString() });
    served.items = [open(`overseer-incident:${RUNNER_INCIDENT}`, 'The Overseer runner saw the Office down'), open('overseer-stopped', 'The Overseer runner is stopped'), open('dependabot:41', 'Dependabot PR #41 was not adopted')];
    expect(outboxItems(observe(s)).map(found => found.subject.id)).toEqual(['dependabot:41']);
});
