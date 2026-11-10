/** Only the two existing Office-managed dependency repositories may use the handoff. */
const REPOSITORIES = new Set(['JFusco/brain', 'JFusco/cms-field-vocabulary']);

export function centralCompanionHandoff(repository: string, enabled = process.env.OFFICE_PIN_COURIER_CENTRAL_ISSUES): boolean {
    return enabled === 'true' && REPOSITORIES.has(repository);
}

/** App identity, exact repository/PR marker and URL are required; a copied marker is insufficient. */
export function centralCompanionIssue(issue: any, repository: string, pr: number): boolean {
    return REPOSITORIES.has(repository) && !issue.pull_request &&
        issue.user?.login === 'pin-courier[bot]' && issue.user.id === 351979519 &&
        Number.isSafeInteger(issue.number) && issue.number > 0 &&
        issue.html_url === `https://github.com/${repository}/issues/${issue.number}` &&
        String(issue.body || '').includes(`<!-- pin-courier-companion:v1 ${repository}#${pr} -->`) &&
        String(issue.body || '').includes(`<!-- office-pin-courier-pr:${pr} -->`);
}
