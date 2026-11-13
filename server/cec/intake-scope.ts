/** An explicitly configured list replaces board membership; it is never a 404 fallback. */
export interface IntakeBinding { site: string; board: number; account: string; intakeListUrl?: string }
export function projectListScope(binding: IntakeBinding): { url: string; jql: string } | undefined {
    if (binding.intakeListUrl === undefined) return undefined;
    const url = new URL(binding.intakeListUrl), site = new URL(binding.site);
    if (url.protocol !== 'https:' || url.origin !== site.origin || url.username || url.password || url.hash ||
        url.pathname !== '/jira/software/c/projects/CEC/list' || [...url.searchParams.keys()].some(key => key !== 'jql') || url.searchParams.getAll('jql').length !== 1)
        throw new Error('CEC intake list must be the configured site’s CEC project list');
    // Deliberately support the project/assignee list contract, not arbitrary JQL or
    // operators that could broaden the configured pickup boundary.
    const account = binding.account.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp('^project\\s*=\\s*CEC\\s+AND\\s+assignee\\s*=\\s*(?:"' + account + '"|' + account + ')\\s+ORDER\\s+BY\\s+cf\\[([1-9][0-9]*)\\]\\s+(ASC|DESC)$', 'i').exec(url.searchParams.get('jql') || '');
    if (!match) throw new Error('CEC intake list must select project CEC and the configured assignee only');
    return { url: url.href, jql: `project = CEC AND assignee = "${binding.account}"` };
}
export function intakeLocation(binding: IntakeBinding): { name: string; url: string } {
    const list = projectListScope(binding);
    return list ? { name: 'CEC Jira list', url: list.url } : { name: 'CEC Jira board', url: `${binding.site}/secure/RapidBoard.jspa?rapidView=${binding.board}` };
}
export function intakeMembership(binding: IntakeBinding): string {
    const list = projectListScope(binding);
    return list
        ? `Verify membership in the explicitly configured CEC project list ${list.url} using the current JQL (${list.jql}). Set boardMember=true only after this membership is verified; this legacy field represents configured intake membership. Do not read the retired board or require board/backlog membership in list mode.`
        : `Verify board ${binding.board} membership using its CURRENT filter or board membership operation. Never infer board membership from project alone.`;
}
export function intakeEnumeration(binding: IntakeBinding): string {
    const list = projectListScope(binding);
    return list
        ? `The intake source is the explicitly configured CEC project list ${list.url}. Query (${list.jql}) with full pagination, intersected with the eligibility query below. Set boardMember=true only for verified list members. Do not read the retired board or enumerate its backlog.`
        : 'Get the CURRENT board configuration/filter, enumerate board AND backlog with full pagination, intersect with the eligibility query below. Do not infer board membership from project alone.';
}
export async function intakeJql(binding: IntakeBinding, readBoardFilter: () => Promise<string>): Promise<string> {
    const list = projectListScope(binding);
    return list ? list.jql : 'filter = ' + await readBoardFilter();
}
