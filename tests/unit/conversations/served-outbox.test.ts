import { expect, test } from 'vitest';
import type { HumanAction } from '../../../src/shared';
import { servedOutbox } from '../../../server/conversations/served-outbox';

const item = (id: string, status: HumanAction['status'] = 'open'): HumanAction => ({ id, title: id, detail: '', role: 'pm', ticket: '', url: '', status, createdAt: '2026-11-26T12:00:00.000Z', updatedAt: '2026-11-26T12:00:00.000Z' });

test('notices come first and once; a saved copy of either kind is dropped, open or resolved, and the project keeps its own items in order', () => {
    const saved = [item('ticket-job:1'), item('overseer-stopped', 'resolved'), item('overseer-incident:inc-0000000000000001'), item('question:2')];
    expect(servedOutbox(saved, [item('overseer-stopped')]).map(entry => [entry.id, entry.status])).toEqual([['overseer-stopped', 'open'], ['ticket-job:1', 'open'], ['question:2', 'open']]);
    // Once a notice clears, no copy of it is served.
    expect(servedOutbox(saved, []).map(entry => entry.id)).toEqual(['ticket-job:1', 'question:2']);
    expect(saved).toHaveLength(4);
});
