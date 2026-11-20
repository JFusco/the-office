import { holdReason } from '../../office/project-holds';
import { harnessEffect } from '../harness/effect';
import { resolveLane } from '../board/move-lane';
import { cardStatus, projectCards, setCardStatus, statusField, type Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Why the harness is returning a parked card: `slug` names its marker and Effects, `label` its refusals. */
export interface PickupReturn { slug: string; label: string; body: (lane: string) => string }

/** Whether any attempt of this lane write (including `:retry-n` ids after a rejected preflight) awaits read-back. */
function unreadLaneWrite(store: Store, base: string): boolean {
    for (let attempt = 0; ; attempt++) {
        const intent = store.getEffect(attempt ? `${base}:retry-${attempt}` : base);
        if (!intent) return false;
        if (['dispatching', 'uncertain'].includes(intent.status)) return true;
    }
}

/**
 * Moves a card the harness parked in Block back to the pickup lane, with one issue comment saying why;
 * `resumeParked` then resumes the job on a later poll. Both writes are Effects: one dispatch, settled by
 * read-back. Returns the board's name for the lane, or null when the card is no longer in Block, which
 * leaves a person's own move alone. A hold, a pause or a job that is no longer the published park stops it
 * before any write.
 */
export async function returnCardToPickup(store: Store, execute: Execute, job: TicketJob, lane: string, reason: PickupReturn): Promise<string | null> {
    const repository = store.project.repository, issueNumber = Number(job.key.slice(3)), attempt = job.steps.length;
    const field = await statusField(store, execute), block = resolveLane(field, 'Block');
    const pickup = field.options.filter(option => option.name.trim().toLowerCase() === lane.trim().toLowerCase());
    if (pickup.length !== 1) throw new Error(`Project board needs exactly one "${lane}" Status option; found ${pickup.length}`);
    const card = (await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: issueNumber }]))[0];
    if (!card) throw new Error('Issue has no card on its configured board');
    const guard = async () => {
        if (store.state.paused || store.state.draining || holdReason(store.project, job.key) || job.status !== 'blocked' || !job.parked?.published)
            throw new Error(`${reason.label} stopped: the parked job changed`);
        if (await cardStatus(store, execute, card.id, field.fieldId) !== block.id)
            throw new Error(`${reason.label} stopped: the card left Block`);
    };
    // A lane write whose outcome was never read back is reconciled by reading, whatever lane the card shows now.
    const reconciling = unreadLaneWrite(store, `harness:${job.id}:${reason.slug}-lane:${attempt}`);
    if (!reconciling && await cardStatus(store, execute, card.id, field.fieldId) !== block.id) return null;
    const marker = `Office ${reason.slug} ${job.id}:${attempt}`;
    const findComment = async () => {
        const pages = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        const comment = pages.flat().find((item: any) => item.body?.includes(marker));
        return comment ? { id: comment.id as number, url: comment.html_url as string } : null;
    };
    const body = `${marker}: ${reason.body(pickup[0].name)}`;
    if (!reconciling && !await findComment())
        await harnessEffect(store, job, { key: `${reason.slug}-comment:${attempt}`, operation: 'github-issue-comment', target: `https://github.com/${repository}/issues/${issueNumber}`, payload: { marker }, guard,
            dispatch: async () => { await execute('gh', ['api', `repos/${repository}/issues/${issueNumber}/comments`, '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 }); return findComment(); },
            readBack: findComment });
    const readLane = async () => await cardStatus(store, execute, card.id, field.fieldId) === pickup[0].id ? { lane: pickup[0].name } : null;
    await harnessEffect(store, job, { key: `${reason.slug}-lane:${attempt}`, operation: 'github-project-status', target: `${field.projectId}:${card.id}`, payload: { option: pickup[0].id }, guard,
        dispatch: async () => { await setCardStatus(store, execute, field.projectId, card.id, field.fieldId, pickup[0].id); return readLane(); },
        readBack: readLane });
    return pickup[0].name;
}
