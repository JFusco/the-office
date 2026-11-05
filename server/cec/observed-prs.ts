type ProviderPR = { pullRequestId: number; status: string; [key: string]: any };

/** Open work must not disappear behind newer completed PRs in the recent-history window. */
export async function readAzurePRs(repository: string, read: (args: string[]) => Promise<ProviderPR[]>): Promise<ProviderPR[]> {
    const base = ['repos', 'pr', 'list', '--repository', repository];
    const recent = await read([...base, '--status', 'all', '--top', '25']);
    const active = new Map<number, ProviderPR>();
    for (let page = 0; page < 10; page++) {
        const rows = await read([...base, '--status', 'active', '--top', '100', '--skip', String(page * 100)]);
        for (const row of rows) {
            if (!Number.isInteger(row.pullRequestId) || row.status !== 'active' || active.has(row.pullRequestId)) throw new Error('Azure active PR pagination changed or did not advance; retain the previous observation.');
            active.set(row.pullRequestId, row);
        }
        if (rows.length < 100) return [...active.values(), ...recent.filter(pr => !active.has(pr.pullRequestId))];
    }
    throw new Error('Azure active PR observation exceeded 1000 items; retain the previous observation.');
}
