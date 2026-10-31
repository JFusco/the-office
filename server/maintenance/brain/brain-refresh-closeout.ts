import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { Store } from '../../store/store';
import type { Engine } from '../../scheduling/engine';
import { command } from '../../workers/process';
import { GitHubOperations } from '../../github/github-operations';
const Assessment = z.object({ covered: z.boolean(), nativeRunId: z.string(), issueUpdatedAt: z.string(), summary: z.string().min(1).max(4000), criteria: z.array(z.object({ requirement: z.string().min(1), evidence: z.string().min(1) }).strict()).min(1), blockers: z.array(z.string()) }).strict();
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Reconcile a completed native refresh against an older issue, never rerun it. */
export async function closeNativeRefresh(store: Store, engine: Engine, key: string, nativeRunId: string, requestId: string, execute: typeof command = command): Promise<void> {
    if (store.project.id !== 'brain' || !/^GH-\d+$/.test(key) || !/^[a-f0-9-]{36}$/.test(nativeRunId))
        throw new Error('Native refresh identity is invalid');
    const number = Number(key.slice(3)), operations = new GitHubOperations(store, execute);
    const status = () => (engine.maintenance as import('./brain-maintenance').BrainMaintenance).readStatus();
    const native = await status(), completed = native.completed;
    if (native.active || completed?.id !== nativeRunId || completed.phase !== 'completed' || !completed.completedAt || !completed.reportSha256 || !completed.authorId)
        throw new Error('Native completion is not independently established');
    const wrapper = store.state.maintenance?.runs.find(run => run.status === 'completed' && (run.nativeRunId === nativeRunId || store.state.coordination?.continuations?.some(continuation => continuation.runId === run.id && continuation.nativeRunId === nativeRunId && continuation.status === 'completed')));
    if (!wrapper)
        throw new Error('Completed native run has no reconciled Office wrapper; preserve original run lineage');
    const issue = await operations.issue(number), comments = await operations.comments(number);
    const originalComment = store.getEffect<{
        text: string;
    }>(`native-closeout-comment:${number}:${nativeRunId}`);
    const ownComments = originalComment ? comments.filter(comment => comment.body === originalComment.payload.text && Date.parse(comment.created_at) >= Date.parse(originalComment.createdAt) - 2000) : [];
    if (ownComments.length > 1)
        throw new Error('Original acceptance comment identity is ambiguous');
    let ownComment: any = ownComments[0];
    const issueFacts = (value: any) => ({ number: value.number, title: value.title, body: value.body, assignees: value.assignees?.map((person: any) => person.login).sort() });
    const expectedIssue = fingerprint(issueFacts(issue)), expectedComments = fingerprint(comments.filter(comment => comment.id !== ownComment?.id).map(comment => [comment.id, comment.body, comment.updated_at]));
    const packet = { id: completed.id, slotDate: completed.slotDate, authorId: completed.authorId, completedAt: completed.completedAt, outcome: completed.outcome, reportSha256: completed.reportSha256, prs: (completed.prs || []).map((pr: any) => ({ number: pr.number, headSha: pr.headSha, mergeCommit: pr.mergeCommit })) };
    const result = await engine.agents.run('pm', `READ ONLY acceptance reconciliation for ${store.project.repository} ${key}. This older refresh issue may be covered by an already completed native run; never claim a nightly slot, sync sources, rerun checks, publish, edit source, or close/update anything yourself. Compare EVERY actual issue requirement and human hold with the actual native report, source coverage, failures retained, bounded link checks, independent review and required cleanup/follow-up. Read repository instructions and native artifacts for the supplied run. A later date or merged PR alone is insufficient. Preserve all original failed runs and last-good catalogs. Return covered=true only with criterion-by-criterion actual evidence for the FULL old issue. Any unresolved source contraction, failed checks, missing follow-up, access restriction, new human hold or uncertain original effect means covered=false with exact blockers. Native completion: ${JSON.stringify(packet)}. Office wrapper: ${JSON.stringify(wrapper)}. Issue: ${JSON.stringify(issue)}. All issue comments: ${JSON.stringify(comments)}. Return the same nativeRunId and issueUpdatedAt; semantic proposal only.`, Assessment, { readOnly: true, ticket: key, stage: 'native-refresh-acceptance', requestId, cwd: store.project.repo, timeout: 20 * 60000 });
    if (!result.covered || result.blockers.length || result.nativeRunId !== nativeRunId || result.issueUpdatedAt !== issue.updated_at)
        throw new Error(result.blockers.join('\n') || result.summary || 'Native refresh does not establish full issue acceptance');
    for (const pr of packet.prs) {
        const pull = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/pulls/${pr.number}`], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        if (!pull.merged_at || pull.head?.sha !== pr.headSha || pull.merge_commit_sha !== pr.mergeCommit)
            throw new Error('Native publication PR identity changed');
        const runs = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/actions/runs?head_sha=${pr.mergeCommit}&per_page=100`], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const actual = runs.workflow_runs?.filter((run: any) => run.head_sha === pr.mergeCommit && run.event === 'push');
        if (runs.total_count > 100 || !actual?.length || actual.some((run: any) => run.status !== 'completed' || !['success', 'neutral', 'skipped'].includes(run.conclusion)))
            throw new Error('Native merge checks or follow-up remain incomplete');
    }
    const preflight = async () => {
        const gate = await status();
        if (store.state.paused || gate.active || gate.completed?.id !== nativeRunId || gate.completed.reportSha256 !== packet.reportSha256)
            throw new Error('Native completion changed before closeout effect');
        const current = await operations.issue(number);
        if (fingerprint(issueFacts(current)) !== expectedIssue || !current.assignees?.some((person: any) => person.login === 'JFusco'))
            throw new Error('Issue scope or assignment changed during acceptance');
        const currentComments = (await operations.comments(number)).filter(comment => comment.id !== ownComment?.id);
        if (fingerprint(currentComments.map(comment => [comment.id, comment.body, comment.updated_at])) !== expectedComments)
            throw new Error('Issue comments changed; reassess new human instructions before closeout');
    };
    const text = `Office native refresh acceptance · ${nativeRunId}\n\n${result.summary}\n\n${result.criteria.map(criterion => `- ${criterion.requirement}: ${criterion.evidence}`).join('\n')}\n\nNative completion: ${completed.completedAt}. Original failed runs, repair links and last-good evidence remain retained. This closes this issue only after its own requirements were reconciled.`;
    ownComment = await operations.comment(number, nativeRunId, text, preflight);
    await operations.closeIssue(number, nativeRunId, preflight);
    await operations.done(number, nativeRunId, preflight);
    store.transaction(() => {
        const ticket = store.state.tickets.find(ticket => ticket.key === key);
        if (ticket) {
            ticket.status = 'closed';
            ticket.activity = 'idle';
            ticket.stage = 'complete';
            ticket.blocker = '';
        }
        store.emit('native-refresh-closed', `${key}: native completion, acceptance comment, issue closure and Done lane verified.`, 'pm', key);
    });
}
