/** A second Jira/Azure project, configured entirely from its own entry. Every value is a placeholder. */
export const ACME_AUTHORITY = 'Pat approved the Acme delivery pilot on 2026-11-02. Draft PRs to develop only; no merge, deployment or production writes.';

export const acmeEntry = {
    id: 'acme', name: 'Acme', provider: 'azure', repo: '/tmp/acme-web', repository: 'acme-web', target: 'develop',
    jira: {
        site: 'https://acme.example.net', cloudId: 'acme-cloud', account: 'acme-account', projectKey: 'ACME', board: 12,
        twgProfile: 'acme', credentialAccount: 'office@acme.example',
        statuses: { intake: [{ name: 'Selected', id: '10100' }, { name: 'Ready', id: '10101' }], stages: { understand: 'Doing', qa: 'Testing', retest: 'Testing' }, blocked: 'On Hold' },
    },
    azure: {
        organization: 'https://dev.azure.com/acme', project: 'Acme', repositoryId: 'acme-repo-id',
        deployment: { subscription: 'acme-sub', resourceGroup: 'acme-rg', containerApp: 'acme-web-dev', healthy: 'http-ok' },
    },
    prompt: { authority: ACME_AUTHORITY },
};

/** The legacy `cec` block of the same office. */
export const legacyCec = { site: 'https://cec.example.net', cloudId: 'cec-cloud', board: 7, account: 'cec-account', repo: '/tmp/cos', organization: 'https://dev.azure.com/cec', project: 'Cec', repository: 'cos', repositoryId: 'cec-repo-id', target: 'staging' };
export const cecEntry = { id: 'cec', name: 'CEC', provider: 'azure', repo: legacyCec.repo, repository: legacyCec.repository, target: legacyCec.target };
