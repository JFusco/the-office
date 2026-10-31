/** Keep native exec streaming; this change deliberately introduces no App Server. */
export function codexArguments(schemaPath: string, cwd: string, readOnly: boolean): string[] {
    const args = ['exec', '--json', '--skip-git-repo-check', '--color', 'never', '--output-schema', schemaPath, '--cd', cwd];
    return readOnly ? [...args, '--sandbox', 'read-only', '-c', 'approval_policy="on-request"', '-c', 'approvals_reviewer="auto_review"'] : [...args, '--approve-for-me'];
}
