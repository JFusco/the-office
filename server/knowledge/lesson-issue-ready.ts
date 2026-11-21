import { Effects } from '../store/effects';
import type { Store } from '../store/store';
import type { command } from '../workers/process';
import { cardStatus, projectCards, setCardStatus, statusField } from '../delivery/board/project-graphql';
import { defaultPickupStatus } from '../delivery/intake/default-pickup';

export type Wait = (ms: number) => Promise<void>;
const pause: Wait = ms => new Promise(resolve => setTimeout(resolve, ms));
/** GitHub's own project automation adds the card and sets its first lane a few seconds after the issue exists. */
const SETTLE_READS = 6, SETTLE_MS = 5000;
interface LaneMove { project: string; item: string; field: string; option: string; lane: string; backlog: string }

const instruction = (store: Store, lessonId: string) => store.state.knowledge?.lessons.find(item => item.id === lessonId)?.repositoryInstruction;

function settle(store: Store, lessonId: string, detail: string): void {
    store.transition('lesson-issue-lane', `Lesson issue card: ${detail}`, () => {
        const filed = instruction(store, lessonId);
        if (filed) { delete filed.lanePending; delete filed.laneAttempt; }
    }, 'knowledge');
}

/** Only a card still in the lane GitHub's automation gave it (no Status, or Backlog) is moved; any other lane is a person's. */
const firstLane = (status: string | undefined, move: Pick<LaneMove, 'backlog'>) => !status || !!move.backlog && status === move.backlog;

/** One durable lane write. Preflight re-reads the card, so a lane a person chose after the first read is never overwritten. */
async function move(store: Store, execute: typeof command, lessonId: string, id: string, payload: LaneMove): Promise<void> {
    const effects = new Effects(store);
    await effects.execute({
        id, work: { projectId: store.project.id, kind: 'retrospective', id: lessonId }, attemptId: lessonId,
        operation: 'lesson-issue-lane', target: payload.item, authorization: 'joe-approved-lesson-issue', payload, expectedState: { lane: 'first' },
        preflight: async () => {
            if (!instruction(store, lessonId)?.lanePending) throw new Error('The lesson issue lane was already settled');
            if (!firstLane(await cardStatus(store, execute, payload.item, payload.field), payload)) throw new Error('The card left its first lane before the move');
        },
        dispatch: async saved => { await setCardStatus(store, execute, saved.project, saved.item, saved.field, saved.option); return { item: saved.item }; },
        verify: async (_receipt, saved) => await cardStatus(store, execute, saved.item, saved.field) === saved.option,
    });
}

/**
 * Moves a promoted lesson's issue card into the project's pickup lane, so intake admits it like any assigned card there:
 * Joe's promotion is the request to deliver it. Waits for GitHub's project automation to add the card and set its
 * first lane, and moves it only out of that lane. Each attempt is one Effect: an attempted move is settled by read-back
 * of the saved card and lane and never resent; a refused attempt that was never sent is replaced by a fresh one.
 */
export async function readyLessonIssue(store: Store, execute: typeof command, lessonId: string, wait: Wait = pause): Promise<void> {
    const filed = instruction(store, lessonId);
    if (filed?.status !== 'filed' || !filed.lanePending || !filed.issueUrl) return;
    const id = `lesson-issue-ready:${lessonId}:${filed.laneAttempt || 0}`, prior = store.getEffect<LaneMove>(id);
    if (prior?.status === 'verified') return settle(store, lessonId, `${prior.payload.lane} verified by read-back`);
    if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
        const saved = prior.payload;
        if (!await new Effects(store).reconcile(id, async () => ({ verified: await cardStatus(store, execute, saved.item, saved.field) === saved.option, receipt: { item: saved.item } })))
            throw new Error('The earlier lane move is still unconfirmed on the board; it will not be sent twice');
        return settle(store, lessonId, `${saved.lane} verified by read-back`);
    }
    if (prior?.status === 'rejected' && prior.dispatchedAt !== '')
        throw new Error('The earlier lane move was rejected after dispatch and will not be sent twice');
    if (!store.project.githubProject) return settle(store, lessonId, 'this project has no board');
    if (prior?.status === 'prepared') { await move(store, execute, lessonId, id, prior.payload); return settle(store, lessonId, `${prior.payload.lane} verified by read-back`); }
    if (prior?.status === 'rejected') {
        // Refused before dispatch, so nothing was sent; the next attempt reads the card afresh.
        store.transition('lesson-issue-lane-retry', `Lesson issue card: earlier move was refused before sending (${prior.error})`, () => {
            const current = instruction(store, lessonId);
            if (current) current.laneAttempt = (current.laneAttempt || 0) + 1;
        }, 'knowledge');
        return readyLessonIssue(store, execute, lessonId, wait);
    }
    const issue = /^https:\/\/github\.com\/([^/?#]+\/[^/?#]+)\/issues\/([1-9]\d*)$/.exec(filed.issueUrl);
    if (!issue || issue[1].toLowerCase() !== store.project.repository?.toLowerCase())
        throw new Error('The filed lesson issue URL does not match the configured GitHub repository');
    const number = Number(issue[2]);
    if (!Number.isSafeInteger(number)) throw new Error('The filed lesson issue URL has an invalid issue number');
    const lane = store.state.coordination?.pickup?.status || defaultPickupStatus(store.project);
    const field = await statusField(store, execute);
    const targets = field.options.filter(option => option.name === lane);
    if (targets.length !== 1) throw new Error(`Project board needs exactly one "${lane}" Status option; found ${targets.length}`);
    const backlogs = field.options.filter(option => option.name.trim().toLowerCase() === 'backlog');
    const card = async () => (await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number }]))[0];
    let found = await card(), current = found && await cardStatus(store, execute, found.id, field.fieldId);
    for (let read = 0; read < SETTLE_READS && !current; read++) {
        await wait(SETTLE_MS);
        found = await card();
        current = found && await cardStatus(store, execute, found.id, field.fieldId);
    }
    if (!found) throw new Error('The lesson issue has no card on its project board yet; the lane move will be tried again');
    const payload: LaneMove = { project: field.projectId, item: found.id, field: field.fieldId, option: targets[0].id, lane: targets[0].name, backlog: backlogs.length === 1 ? backlogs[0].id : '' };
    if (current === payload.option) return settle(store, lessonId, `already in ${payload.lane}`);
    if (!firstLane(current, payload)) return settle(store, lessonId, `left in ${field.options.find(option => option.id === current)?.name || 'a lane this board no longer lists'}, where a person moved it`);
    await move(store, execute, lessonId, id, payload);
    settle(store, lessonId, `${payload.lane} verified by read-back`);
}

/** A lane move that cannot finish now stays pending for the daily lesson-issue check; it never fails the filing. */
export async function tryReadyLessonIssue(store: Store, execute: typeof command, lessonId: string, wait: Wait = pause): Promise<void> {
    try { await readyLessonIssue(store, execute, lessonId, wait); }
    catch (error) { store.emit('lesson-issue-lane-pending', `Lesson issue card is not in the pickup lane yet: ${String(error)}`, 'knowledge'); }
}

/** The daily lesson-issue check retries only cards still waiting for their lane; one failure leaves the rest unaffected. */
export async function readyPendingLessonIssues(store: Store, execute: typeof command, wait: Wait = pause): Promise<void> {
    for (const lesson of [...(store.state.knowledge?.lessons || [])].filter(item => item.repositoryInstruction?.lanePending))
        await tryReadyLessonIssue(store, execute, lesson.id, wait);
}
