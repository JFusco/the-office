import { useState } from 'react';
import type { OfficeSnapshot } from '../shared';
import { mutedCopy } from '../ui';
import { dueLessonDecisions } from './lesson-digest';
import { OutboxLessonDecision } from './OutboxLessonDecision';

/**
 * The proposals in this week's digest, each with its own decision. The list is fixed when the
 * digest is opened, so a decided proposal stays on screen with its outcome.
 */
export function OutboxLessonDigest({ snapshot, refresh, at }: { snapshot: OfficeSnapshot; refresh?: () => Promise<void>; at?: Date }) {
    // The Office's clock decides the week, as it does for the digest's title.
    const [decisions] = useState(() => dueLessonDecisions(snapshot, at || (Number.isNaN(Date.parse(snapshot.serverTime)) ? new Date() : new Date(snapshot.serverTime))));
    if (!decisions.length) return <p className={mutedCopy}>Every proposal in this digest has been decided.</p>;
    return <>{decisions.map(decision => <section key={`${snapshot.project?.id}:${decision.id}`} data-outbox-lesson-digest-item aria-label={decision.statement} className="flex flex-col gap-3.5">
        <OutboxLessonDecision snapshot={snapshot} actionId={decision.id} refresh={refresh} />
    </section>)}</>;
}
