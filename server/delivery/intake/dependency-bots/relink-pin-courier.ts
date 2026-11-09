import { createHash } from 'node:crypto';
import { HOLDS } from '../../../office/config';
import { Effects } from '../../../store/effects';
import { harnessEffect } from '../../harness/effect';
import { readBackOrThrow } from '../../harness/read-retry';
import { projectGraphql, type Execute } from '../../board/project-graphql';
import { resumeLinkedDelivery } from './resume-linked-delivery';
import { findTrackingIssue } from '../dependabot/tracking-issue';
import type { DependabotPR } from '../dependabot/qualify';
import type { Store } from '../../../store/store';
import { workKey, type DependabotAdoption, type EffectIntent, type TicketJob } from '../../../../src/shared';

const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const editorMatches = (editor: any) => editor?.__typename === 'Bot' && editor.login === 'pin-courier' && editor.databaseId === 351979519;

/** A bot may replace its description without changing commits. Preserve the old receipt; link this observed body revision once. */
export async function relinkPinCourier(store: Store, execute: Execute, record: DependabotAdoption, pr: DependabotPR, jobs: TicketJob[], headGuard: () => Promise<void>): Promise<void> {
    const issue = record.issue, job = jobs.find(j => j.key === `GH-${issue}` && j.pr === pr.number && !['completed', 'cancelled'].includes(j.status));
    const guard = () => {
        if (!job || !jobs.includes(job) || job.key !== `GH-${issue}` || job.pr !== pr.number || ['completed', 'cancelled'].includes(job.status) ||
            store.state.paused || store.state.draining || HOLDS[`GH-${issue}`] || HOLDS[`GH-${pr.number}`] || record.status !== 'adopted' || record.issue !== issue || record.pr !== pr.number || record.bot !== 'pin-courier' ||
            !store.state.coordination?.adoptions?.includes(record) || job.mergeAttempt ||
            store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id) ||
            store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status)))
            throw new Error('Pin Courier link repair is held or its original delivery is active/changed');
    };
    const [owner, name] = store.project.repository.split('/');
    const read = async () => (await projectGraphql(store, execute,
        'query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){id url state headRefOid body lastEditedAt editor{__typename login ... on Bot{databaseId}} closingIssuesReferences(first:100){nodes{number url} pageInfo{hasNextPage}}}}}',
        { owner, name, number: pr.number })).repository?.pullRequest;
    const issueUrl = `https://github.com/${store.project.repository}/issues/${issue}`;
    const linked = (p: any, head: string) => p?.url === pr.url && p.state === 'OPEN' && p.headRefOid === head &&
        p.closingIssuesReferences?.pageInfo?.hasNextPage === false && p.closingIssuesReferences.nodes.some((i: any) => i.number === issue && i.url === issueUrl);
    const prior = () => (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: record.id })) as { body: string }[])
        .map(row => JSON.parse(row.body) as EffectIntent<{ issue: number }>).filter(e => e.id.startsWith(`harness:${record.id}:pr-body:${pr.number}:`));
    guard();
    const p = await read(); guard();
    if (!await findTrackingIssue(store, execute, pr.number, issue, 'pin-courier')) throw new Error('Original tracking issue no longer matches');
    guard();
    // Never evade an older uncertain PATCH with a new body-version key, even if the bot advanced its head.
    for (const effect of prior()) {
        if (effect.operation !== 'github-pr-body' || effect.target !== pr.url || effect.payload?.issue !== issue)
            throw new Error('Prior PR link intent identity changed');
        const head = /^pr-body:\d+:([a-f0-9]{40})(?::|$)/.exec(String((effect.expectedState as any)?.key))?.[1];
        if (!head || effect.status === 'verified' && (effect.receipt as any)?.head !== head) throw new Error('Prior PR link receipt/head changed');
        if (['dispatching', 'uncertain'].includes(effect.status)) {
            if (!await new Effects(store).reconcile(effect.id, async () => ({ verified: linked(p, head), receipt: { head } })))
                throw new Error('Prior PR link PATCH remains unverified; it will not be resent');
        } else if (effect.status !== 'verified' && !(effect.status === 'rejected' && !effect.dispatchedAt))
            throw new Error('Prior PR link intent requires reconciliation');
    }
    if (linked(p, pr.head)) { guard(); resumeLinkedDelivery(store, job!, pr.head); return; }
    if (!prior().some(e => e.status === 'verified')) throw new Error('No verified original Office link to restore');
    if (p?.url !== pr.url || p.state !== 'OPEN' || p.headRefOid !== pr.head || p.body !== pr.body || !p.id || !Number.isFinite(Date.parse(p.lastEditedAt)) || !editorMatches(p.editor))
        throw new Error('Only a current Pin Courier body rewrite may restore the original issue link; preserve human/unknown edits');
    const snapshot = sha(p), body = `Closes #${issue}\n\n${p.body}`;
    if (body.length > 65_000) throw new Error('PR body is too long to restore its issue link');
    const key = `pr-body:${pr.number}:${pr.head}:body-${sha({ id: p.id, body: p.body, editedAt: p.lastEditedAt, editor: p.editor })}`;
    const receipt = async () => {
        const current = await read();
        return linked(current, pr.head) && current.body === body ? { head: pr.head, issue, bodySha256: sha(body) } : null;
    };
    await harnessEffect(store, record, {
        key, operation: 'github-pr-body', target: pr.url, payload: { issue },
        guard: async () => {
            guard(); await headGuard(); guard();
            if (!await findTrackingIssue(store, execute, pr.number, issue, 'pin-courier')) throw new Error('Original tracking issue no longer matches');
            const current = await read(); guard();
            if (sha(current) !== snapshot) throw new Error('PR body/head/editor/link changed before link repair');
        },
        dispatch: async () => {
            await execute('gh', ['api', `repos/${store.project.repository}/pulls/${pr.number}`, '-X', 'PATCH', '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 });
            return readBackOrThrow(receipt, `Native issue #${issue} link on PR #${pr.number}`);
        },
        readBack: receipt,
    });
    // A terminal effect receipt never authorizes claiming that a later overwritten body is still linked.
    if (!await receipt()) throw new Error('Previously verified body revision changed; retain its receipt for reconciliation');
    guard(); resumeLinkedDelivery(store, job!, pr.head);
}
