export type WorkerProfile = 'reader' | 'editor' | 'checks' | 'jira-native' | 'qa-native' | 'brain-native' | 'github-native' | 'slack-native';
const readers = new Set(['assignment-review', 'readback', 'intake', 'understand', 'ci-diagnose', 'reconcile', 'plan', 'plan-review', 'code-review', 'repair-review', 'github-review', 'github-lead-pr', 'vendor-review', 'proposal-plan', 'proposal-plan-review', 'proposal-review', 'maintenance-readback', 'daily-cto']);
/** Native stages retain their required tools until their typed adapter passes parity. */
export function workerProfile(stage: string, readOnly: boolean, slack = false): {
    name: WorkerProfile;
    readOnly: boolean;
    cutover: 'verified' | 'native';
} {
    if (stage === 'brain-maintenance')
        return { name: 'brain-native', readOnly: false, cutover: 'native' };
    if (slack || stage.startsWith('slack-'))
        return { name: 'slack-native', readOnly, cutover: 'native' };
    if (readOnly || readers.has(stage))
        return { name: 'reader', readOnly: true, cutover: 'verified' };
    if (['enhance', 'transition'].includes(stage))
        return { name: 'jira-native', readOnly: false, cutover: 'native' };
    if (['qa', 'retest', 'staging-qa', 'browser-verification'].includes(stage))
        return { name: 'qa-native', readOnly: false, cutover: 'native' };
    return { name: 'github-native', readOnly: false, cutover: 'native' };
}
