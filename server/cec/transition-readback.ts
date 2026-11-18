import { twgConnection } from './twg-connection';
import { ownTicket } from '../office/ticket-key';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { StageResult, Ticket } from '../../src/shared';
import { holdReason } from '../office/project-holds';
import { jiraBinding } from '../office/project-bindings';
import { PROJECT_BINDINGS } from '../office/projects';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { jiraRecord } from './jira-record';
import { unpack } from './jira-response';
import { sanitize } from '../office/security';

function metadataDigest(value: unknown): string {
    const ordered = (_key: string, item: unknown) => item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item;
    return createHash('sha256').update(JSON.stringify(value, ordered)).digest('hex');
}

export function verifiedTransition(result: StageResult): boolean {
    return result.outcome === 'passed' && !result.blocker &&
        result.receipts.every(receipt => receipt.verified && !receipt.uncertain) &&
        result.receipts.some(receipt => receipt.action === 'jira-transition');
}

/** A model's read-only receipt is not a transition. Establish the status natively instead. */
export async function verifyAlreadyAtStatus(store: Store, ticket: Ticket, target: string,
    result: StageResult, execute: typeof command = command): Promise<StageResult> {
    const jira = jiraBinding(store.project);
    if (verifiedTransition(result) || result.outcome !== 'passed' || result.blocker || result.paidRuns !== 0 ||
        !result.receipts.length || !result.receipts.every(receipt => receipt.verified && !receipt.uncertain &&
            receipt.action === 'jira-read-only' && [ticket.key, `${jira.site}/browse/${ticket.key}`].includes(receipt.target))) return result;
    const binding = { key: ticket.key, runId: ticket.runId, stage: ticket.stage, commit: ticket.commit, target,
        site: jira.site, account: jira.account, projectId: store.project.id };
    const id = randomUUID(), directory = resolve(store.dataRoot, 'runs', ticket.runId, 'transition-readbacks', id);
    let directoryCreated = false;
    const save = (name: string, value: unknown) => writeFileSync(resolve(directory, name), JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
    try {
        if (store.project.provider !== 'azure' || !PROJECT_BINDINGS.has(store.project.id) || !ownTicket(store.project, ticket.key) ||
            !/^[a-zA-Z0-9-]+$/.test(ticket.runId) || !Object.values(jira.statuses.stages).includes(target) ||
            holdReason(store.project, ticket.key) || ticket.assignee !== jira.account || ticket.subtask !== false || ticket.boardMember !== true)
            throw new Error('Jira status read-back scope or eligibility changed');
        mkdirSync(directory, { recursive: true, mode: 0o700 });
        directoryCreated = true;
        save('intent.json', { ...binding, at: store.clock.now().toISOString(), originalResult: result,
            operation: 'Read the same issue twice; never transition, comment or change metadata' });
        const read = async () => {
            const issue = jiraRecord(unpack(await execute('twg', ['jira', 'workitem', 'get', ticket.key,
                ...twgConnection(jira), '-o', 'json', '--output-summary', 'none'], { readOnly: true, timeout: 60000 })), ticket.key);
            const fields = issue.fields || issue;
            if (fields.status?.name !== target || !fields.status?.id || fields.assignee?.accountId !== jira.account ||
                fields.issuetype?.subtask !== false || !fields.issuetype?.name || fields.issuetype.name === 'Epic' || !fields.updated)
                throw new Error('Live Jira status, assignment or parent type does not match the requested handoff');
            return { key: issue.key, status: fields.status.name, statusId: String(fields.status.id),
                assignee: fields.assignee.accountId, type: fields.issuetype.name, updated: fields.updated,
                metadataSha256: metadataDigest(issue) };
        };
        const before = await read(); save('before.json', before);
        const after = await read(); save('after.json', after);
        if (JSON.stringify(before) !== JSON.stringify(after) || holdReason(store.project, ticket.key) ||
            JSON.stringify(binding) !== JSON.stringify({ key: ticket.key, runId: ticket.runId, stage: ticket.stage,
                commit: ticket.commit, target, site: jira.site, account: jira.account, projectId: store.project.id }))
            throw new Error('Jira metadata or the candidate changed during status read-back');
        const at = store.clock.now().toISOString(), detail = `Native read-only verification: already ${target} (${after.statusId}); two identical issue reads. No Jira mutation dispatched.`;
        const proof = { ...binding, observedAt: at, before, after, detail };
        save('verified.json', proof);
        return { ...result, receipts: [...result.receipts, { id: `native-status:${id}`, action: 'jira-transition',
            target: `${jira.site}/browse/${ticket.key}`, verified: true, uncertain: false, detail }],
            evidence: [...result.evidence, { id: `native-status:${id}`, kind: 'jira', summary: detail,
                path: resolve(directory, 'verified.json'), commit: ticket.commit, environment: jira.site,
                url: `${jira.site}/browse/${ticket.key}`, observedAt: at }] };
    }
    catch (error) {
        const blocker = `Jira status read-back could not be verified: ${sanitize(String(error))}`;
        if (directoryCreated) save('failure.json', { ...binding, at: store.clock.now().toISOString(), blocker });
        return { ...result, outcome: 'blocked', blocker };
    }
}
