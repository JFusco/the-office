import type { SlackSeedProgress } from '../contracts/knowledge';
const completedTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
export function SlackSeedStatus({ seed }: { seed?: SlackSeedProgress }) {
    if (!seed) return null;
    const complete = seed.status === 'complete-with-gaps';
    return <div className="mt-3 text-11 leading-relaxed" data-slack-seed-status>
        <p>Historical Slack seed · {complete ? 'Complete with coverage gaps' : seed.status === 'needs-attention' ? 'Needs attention' : 'In progress'}</p>
        <p>{seed.channelsEnumerated}/{seed.channelsTotal} channel histories finished. {seed.pendingReads} reads, {seed.pendingCaptures} captures and {seed.unresolvedSources} source outcomes remain.</p>
        {seed.completedAt ? <p>Completed <time dateTime={seed.completedAt}>{completedTime.format(new Date(seed.completedAt))}</time>. Weekly incremental intake continues.</p> : <p>Limit: {seed.dailyLimit} worker launches per New York day. More work may be discovered; these counts are not a completion estimate.</p>}
        <p>{seed.coverageGaps} coverage limitations or unavailable items are recorded in the private intake report.</p>
    </div>;
}
