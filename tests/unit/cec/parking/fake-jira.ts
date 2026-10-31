import { CEC } from '../../../../server/office/config';

/** Synthetic Jira for one or more issues: status, assignee and comments, with injectable transport loss. */
export function fakeJira(issues: Record<string, { status: string; assignee?: string }>) {
    const state = Object.fromEntries(Object.entries(issues).map(([key, issue]) => [key, { status: issue.status, assignee: issue.assignee ?? CEC.account, comments: [] as { id: string; author: { accountId: string }; body: string }[] }]));
    const calls: string[][] = [];
    const faults = { loseTransitionResponse: false, rejectTransition: false, loseCommentResponse: false, failReads: false, afterTransition: undefined as undefined | (() => void) };
    const issue = (key: string) => ({ key, status: { name: state[key].status }, assignee: { accountId: state[key].assignee }, updated: '' });
    const execute: any = async (_program: string, args: string[]) => {
        calls.push(args);
        const [, , command, sub] = args, value = (flag: string) => args[args.indexOf(flag) + 1];
        if (command === 'get') {
            if (faults.failReads) throw new Error('Jira unavailable');
            const keys = args.slice(3, args.indexOf('--site'));
            return JSON.stringify({ data: keys.length === 1 ? issue(keys[0]) : { items: keys.map(issue) } });
        }
        if (command === 'transition') {
            if (faults.rejectTransition) throw new Error('transition rejected');
            state[value('--id')].status = value('--transition-id');
            faults.afterTransition?.();
            if (faults.loseTransitionResponse) throw new Error('transport lost after dispatch');
            return JSON.stringify({ data: { ok: true } });
        }
        if (command === 'comment' && sub === 'create') {
            const comment = { id: String(state[value('--issue-id')].comments.length + 1), author: { accountId: CEC.account }, body: value('--body') };
            state[value('--issue-id')].comments.push(comment);
            if (faults.loseCommentResponse) throw new Error('transport lost after dispatch');
            return JSON.stringify({ data: { comment } });
        }
        if (command === 'comment' && sub === 'query')
            return JSON.stringify({ data: { comments: { nodes: state[value('--issue-id')].comments, pageInfo: { hasNextPage: false } } } });
        throw new Error(`Unexpected Jira call ${args.join(' ')}`);
    };
    const writes = () => calls.filter(args => args[2] === 'transition' || (args[2] === 'comment' && args[3] === 'create')).length;
    return { state, calls, faults, execute, writes };
}
