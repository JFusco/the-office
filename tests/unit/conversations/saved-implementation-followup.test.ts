import { expect, test } from 'vitest';
import { savedImplementationFollowup } from '../../../src/conversations/saved-implementation-followup';
import { ticket, decision } from '../cec/parking/fixtures';

test('offers saved-draft review only for the first failed native writer on the selected ticket', () => {
    const t = ticket(); Object.assign(t, { stage: 'implement', activity: 'blocked', commit: '', branch: '', worktree: '', prId: 0 });
    t.results.implement = decision('', { receipts: [{ id: 'attempt', action: 'implement', target: t.key, uncertain: true, verified: false, detail: '' }] });
    const snapshot: any = { project: { id: 'cec' }, tickets: [t], workLog: [{ id: 'original', ticket: t.key, stage: 'implement', status: 'failed', provider: 'claude', failure: { category: 'uncertain-effect' } }] };
    const id = `ticket:${t.key}:implement`;
    expect(savedImplementationFollowup(snapshot, id)).toBe(t);
    expect(savedImplementationFollowup(snapshot, `ticket:${t.key}:plan`)).toBeUndefined();
    snapshot.project.id = 'brain'; expect(savedImplementationFollowup(snapshot, id)).toBeUndefined(); snapshot.project.id = 'cec';
    t.commit = 'a'.repeat(40); expect(savedImplementationFollowup(snapshot, id)).toBeUndefined(); t.commit = '';
    snapshot.workLog.push({ ...snapshot.workLog[0], id: 'second' }); expect(savedImplementationFollowup(snapshot, id)).toBeUndefined();
});
