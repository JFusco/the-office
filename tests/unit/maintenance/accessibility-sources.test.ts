import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { GitHubMaintenance } from '../../../server/maintenance/maintenance';

const roots: { store: Store; path: string }[] = [];
afterEach(() => roots.splice(0).forEach(({ store, path }) => { store.close(); rmSync(path, { recursive: true, force: true }); }));
function setup(status = 'completed') {
    const path = mkdtempSync(join(tmpdir(), 'office-accessibility-'));
    const project = { ...projectById('cms-field-vocabulary'), id: 'accessibility-standards', name: 'Accessibility Standards',
        repository: 'JFusco/accessibility-standards', githubProject: { owner: 'JFusco', number: 11, url: 'https://github.com/users/JFusco/projects/11' } };
    const store = new Store(':memory:', project, path);
    roots.push({ store, path });
    store.state.paused = false;
    const execute = vi.fn(async (_name: string, args: string[]) => {
        if (args[1] === 'list') return JSON.stringify([{ status, conclusion: 'success', event: 'schedule', databaseId: 17,
            headSha: 'b'.repeat(40), createdAt: new Date().toISOString() }]);
        expect(args.slice(0, 3)).toEqual(['run', 'download', '17']);
        writeFileSync(join(args.at(-1)!, 'standards-scan.json'), JSON.stringify({ mode: 'full', documents: [
            { url: 'https://www.w3.org/TR/WCAG22/', status: 'unavailable', baseline: 'a'.repeat(64), locators: { focus: ['pattern.dialog'] }, error: '503' },
        ] }));
        return '';
    });
    const runAgent = vi.fn(async () => ({ outcome: 'passed', checks: [], receipts: [], candidates: [], ledger: 'Read back existing retrieval issue.', approach: null, summary: '', blocker: '' }));
    return { store, execute, runAgent, maintenance: new GitHubMaintenance(store, { active: new Set(), run: runAgent } as any, execute) };
}

test('the accessibility checkpoint consumes its artifact once and routes findings through delivery without CMS handover', async () => {
    const { maintenance, runAgent, execute } = setup();
    const run = maintenance.request(true);
    expect(run.weekly).toBe(false);
    await maintenance.pump(run.id);
    expect(run.steps.map(step => step.stage)).toEqual(['source-review']);
    expect(runAgent).toHaveBeenCalledWith('pm', expect.stringContaining('pattern.dialog'), expect.anything(), expect.anything());
    expect(JSON.stringify(runAgent.mock.calls)).not.toContain('CMS maintenance');
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(execute).toHaveBeenCalledTimes(2);
    expect(maintenance.request(true).id).toBe(run.id);
});

test('an unfinished scan blocks the checkpoint before a worker can change an issue', async () => {
    const { maintenance, runAgent } = setup('in_progress');
    const run = maintenance.request();
    await maintenance.pump(run.id);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('successful current Accessibility Standards scan');
    expect(runAgent).not.toHaveBeenCalled();
});
