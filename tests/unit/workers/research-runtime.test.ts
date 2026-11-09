import { expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { RESEARCH_CODEX_VERSION, RESEARCH_DISABLED_FEATURES } from '../../../server/workers/research-profile';
import { ResearchResult } from '../../../server/knowledge/weekly-research';

test.each(['knowledge-research', 'knowledge-slack-links'])('public runtime isolation and native receipts: %s', async stage => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-research-runtime-')), cwd = resolve(root, 'public'); mkdirSync(cwd);
    const store = new Store(':memory:', { ...projectById('brain'), repo: resolve(root, 'private-repository') }, resolve(root, 'private-data'));
    const url = 'https://www.sqlite.org/lang_transaction.html', task = 'Read the public SQLite transaction documentation.';
    let dispatched = 0;
    try {
        const runtime = new WorkerRuntime(store, async (program, args, options) => {
            expect(program).toBe('codex');
            if (args[0] === '--version') return RESEARCH_CODEX_VERSION;
            if (args[0] === 'features') return [...RESEARCH_DISABLED_FEATURES, 'code_mode_host'].map(name => `${name} stable false`).join('\n');
            expect(args).not.toContain('web_search="disabled"'); expect(args).toContain('web_search="live"');
            dispatched++; expect(options?.input).toBe(task); expect(options?.cwd).toBe(cwd);
            expect(args).toContain('features.code_mode.excluded_tool_namespaces=["functions"]');
            const source = { topicId: 'public', applicability: 'unknown', contradictions: '', url, retrievedAt: '', version: '3', primary: true, readEvidence: 'invented', claim: 'One writer.' };
            const events = [
                { type: 'thread.started', thread_id: 'research-fixture' },
                { type: 'item.completed', item: { id: 'page-1', type: 'web_search', action: { type: 'open_page', url } } },
                { type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ findings: [], sources: [source, { ...source, url: 'https://www.sqlite.org/unread' }], unavailable: [] }) } },
            ];
            for (const event of events) options?.onLine?.(JSON.stringify(event));
            return events.map(event => JSON.stringify(event)).join('\n');
        });
        const result = await runtime.run('knowledge', task, ResearchResult, { stage, readOnly: true, cwd, requestId: 'research-fixture' });
        expect(dispatched).toBe(1); expect(result.sources.map(source => source.readEvidence)).toEqual(['native-read:page-1', '']);
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
