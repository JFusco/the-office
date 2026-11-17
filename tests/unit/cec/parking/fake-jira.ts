import { CEC } from '../../../../server/office/config';

/**
 * Synthetic Jira for one or more issues: status, assignee and comments, with injectable transport loss.
 * As on the real workflow, a move to Blocked is refused unless its comment travels in the transition request,
 * so the TWG transition is refused and only the REST transition (curl) lands.
 */
export function fakeJira(issues: Record<string, { status: string; assignee?: string }>) {
    const state = Object.fromEntries(Object.entries(issues).map(([key, issue]) => [key, { status: issue.status, assignee: issue.assignee ?? CEC.account, comments: [] as { id: string; author: { accountId: string }; body: any }[] }]));
    const transitions: Record<string, string> = { '131': 'Blocked', '291': 'QA' };
    const calls: string[][] = [];
    const faults = { loseTransitionResponse: false, rejectTransition: false, loseCommentResponse: false, failReads: false, omitInlineComment: false, noCredential: false, noBlockedTransition: false, revokedToken: false, tokenAccount: CEC.account, refuseRest: '', afterTransition: undefined as undefined | (() => void) };
    const issue = (key: string) => ({ key, status: { name: state[key].status }, assignee: { accountId: state[key].assignee }, updated: '2026-10-31T20:00:00Z' });
    const execute: any = async (program: string, args: string[], options: { input?: string } = {}) => {
        if (program === 'security') {
            if (faults.noCredential) throw new Error('The specified item could not be found in the keychain.');
            return args.includes('-w') ? 'synthetic-token\n' : 'keychain: "login.keychain-db"\n    "acct"<blob>="office@example.test"\n    "svce"<blob>="the-office-jira"\n';
        }
        if (program === 'curl') {
            const lines = (options.input || '').split('\n'), setting = (name: string) => { const line = lines.find(item => item.startsWith(`${name} = "`)); return line ? JSON.parse(`"${line.slice(name.length + 4, -1)}"`) as string : ''; };
            if (args.some(arg => arg.includes('synthetic-token')) || setting('user') !== 'office@example.test:synthetic-token' || faults.revokedToken) throw new Error('curl exited 22: curl: (22) The requested URL returned error: 401');
            if (setting('request') === 'GET' && setting('url').endsWith('/rest/api/3/myself')) return JSON.stringify({ accountId: faults.tokenAccount });
            const key = decodeURIComponent(setting('url').split('/issue/')[1].split('/')[0]), body = JSON.parse(setting('data-raw')), comment = body.update?.comment?.[0]?.add?.body;
            calls.push(['rest', 'issue', 'transition', key, String(body.transition.id)]);
            if (faults.rejectTransition) throw new Error('transition rejected');
            // What the real runner reports for a refusal: Jira's body, then curl's own line.
            if (faults.refuseRest || !comment) throw new Error(`curl exited 22: {"errorMessages":["${faults.refuseRest || 'Must leave a comment'}"],"errors":{}}curl: (22) The requested URL returned error: 400`);
            state[key].status = transitions[body.transition.id];
            if (!faults.omitInlineComment) state[key].comments.push({ id: 'inline-1', author: { accountId: CEC.account }, body: comment });
            faults.afterTransition?.();
            if (faults.loseTransitionResponse) throw new Error('transport lost after dispatch');
            return '';
        }
        calls.push(args);
        const [, , command, sub] = args, value = (flag: string) => args[args.indexOf(flag) + 1];
        if (command === 'get') {
            if (faults.failReads) throw new Error('Jira unavailable');
            const keys = args.slice(3, args.indexOf('--site'));
            return JSON.stringify({ data: keys.length === 1 ? issue(keys[0]) : { items: keys.map(issue) } });
        }
        if (command === 'transition') {
            if (!args.includes('--transition-id'))
                return JSON.stringify({ data: { transitions: Object.entries(transitions).filter(([, to]) => to !== 'Blocked' || !faults.noBlockedTransition).map(([id, toName]) => ({ id, name: toName, toName, fields: [{ fieldId: 'assignee', required: false }] })) } });
            // TWG sends the move without its comment and would post the comment afterwards; the workflow refuses the bare move.
            throw new Error('twg exited 1: Error: Must leave a comment\n  Code: TWG_TOOL_EXECUTION_FAILED\n  HTTP status: 400\n');
        }
        if (command === 'comment' && sub === 'create') {
            const comment = { id: String(state[value('--issue-id')].comments.length + 1), author: { accountId: CEC.account }, body: value('--body') };
            state[value('--issue-id')].comments.push(comment);
            if (faults.loseCommentResponse) throw new Error('transport lost after dispatch');
            return JSON.stringify({ data: { comment } });
        }
        if (command === 'comment' && sub === 'query')
            return JSON.stringify({ data: state[value('--issue-id')].comments, pageInfo: { hasNextPage: false, nextCursor: null } });
        throw new Error(`Unexpected Jira call ${args.join(' ')}`);
    };
    const moves = () => calls.filter(args => args[0] === 'rest' && args[2] === 'transition');
    const writes = () => moves().length + calls.filter(args => args[2] === 'comment' && args[3] === 'create').length;
    return { state, calls, faults, execute, writes, moves };
}
