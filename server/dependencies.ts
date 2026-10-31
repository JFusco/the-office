import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { DependencyObservation, Prerequisite, WorkEligibility, WorkRef } from '../src/shared';
import { workKey } from '../src/shared';
import type { Store } from './store';
import { PROJECTS } from './projects';
import { command } from './process';
export const PrerequisiteSchema = z.object({
    target: z.object({ projectId: z.string().min(1), kind: z.enum(['issue', 'pr', 'delivery', 'maintenance']), id: z.string().min(1).max(200) }).strict(),
    condition: z.enum(['issue-closed', 'job-completed', 'pr-merged']),
    evidence: z.string().min(1).max(2000), observedAt: z.string().min(1),
}).strict();
export const PrerequisitesSchema = z.array(PrerequisiteSchema).max(20).nullable();
export type DependencyStores = ReadonlyMap<string, Store>;
const compatible = (dependency: Prerequisite) => dependency.condition === 'issue-closed' ? dependency.target.kind === 'issue' : dependency.condition === 'pr-merged' ? dependency.target.kind === 'pr' : ['delivery', 'maintenance'].includes(dependency.target.kind);
const issueKey = (id: string) => id.replace(/^(?:GH-|issue:|pr:)/, '');
export function validatePrerequisites(dependencies: Prerequisite[], subject: WorkRef, stores: DependencyStores): string | null {
    for (const dependency of dependencies) {
        if (!PROJECTS.some(project => project.id === dependency.target.projectId) || !stores.has(dependency.target.projectId))
            return 'Prerequisite project is unavailable or not configured';
        const targetStore = stores.get(dependency.target.projectId)!;
        if (dependency.condition === 'job-completed' && !(dependency.target.kind === 'maintenance' ? targetStore.state.maintenance?.runs.some(run => run.id === dependency.target.id) : targetStore.state.coordination?.jobs?.some(job => job.id === dependency.target.id || job.key === dependency.target.id)))
            return 'Referenced prerequisite does not exist';
        if (!compatible(dependency))
            return 'Prerequisite target and completion condition disagree';
        if (!Number.isFinite(Date.parse(dependency.observedAt)))
            return 'Prerequisite evidence has an invalid observation time';
        if (dependency.target.projectId === subject.projectId && (workKey(dependency.target) === workKey(subject) || dependency.target.kind === 'issue' && issueKey(dependency.target.id) === issueKey(subject.id)))
            return 'A work item cannot depend on itself';
    }
    const graph = new Map<string, WorkRef[]>();
    for (const [projectId, store] of stores) {
        for (const review of store.state.coordination?.listener.reviews || [])
            graph.set(workKey({ projectId, kind: 'issue', id: issueKey(review.key) }), (review.prerequisites || []).map(dependency => dependency.target));
        for (const job of store.state.coordination?.jobs || []) {
            graph.set(workKey({ projectId, kind: 'delivery', id: job.id }), (job.prerequisites || []).map(dependency => dependency.target));
            graph.set(workKey({ projectId, kind: 'issue', id: issueKey(job.key) }), [{ projectId, kind: 'delivery', id: job.id }]);
        }
    }
    const normalized = (ref: WorkRef) => workKey({ ...ref, id: ref.kind === 'issue' || ref.kind === 'pr' ? issueKey(ref.id) : ref.id });
    const origin = normalized(subject);
    graph.set(origin, dependencies.map(dependency => dependency.target));
    const visiting = new Set<string>(), visited = new Set<string>();
    const cycle = (key: string): boolean => {
        if (visiting.has(key))
            return true;
        if (visited.has(key))
            return false;
        visiting.add(key);
        for (const target of graph.get(key) || [])
            if (cycle(normalized(target)))
                return true;
        visiting.delete(key);
        visited.add(key);
        return false;
    };
    return cycle(origin) ? 'Prerequisite cycle requires reconciliation' : null;
}
export function dependencyEligibility(dependencies: Prerequisite[], stores: DependencyStores, now: Date): WorkEligibility | null {
    for (const dependency of dependencies) {
        const store = stores.get(dependency.target.projectId);
        if (!store)
            return { state: 'blocked', reason: 'Prerequisite project is unavailable', owner: 'Morgan', nextCheckAt: null };
        if (dependency.condition === 'job-completed') {
            const record = dependency.target.kind === 'maintenance'
                ? store.state.maintenance?.runs.find(run => run.id === dependency.target.id)
                : store.state.coordination?.jobs?.find(job => job.id === dependency.target.id || job.key === dependency.target.id);
            if (!record)
                return { state: 'blocked', reason: 'Referenced prerequisite does not exist', owner: 'Morgan', nextCheckAt: null };
            if (record.status === 'completed')
                continue;
            return { state: 'waiting', reason: `Waiting for verified completion of ${dependency.target.id}`, owner: 'Morgan', nextCheckAt: new Date(now.getTime() + 60000).toISOString() };
        }
        const observed = store.state.coordination?.dependencyObservations?.find(observation => workKey(observation.target) === workKey(dependency.target) && observation.condition === dependency.condition);
        if (!observed || now.getTime() - Date.parse(observed.observedAt) > 150000)
            return { state: 'waiting', reason: 'Prerequisite needs a fresh provider observation', owner: 'Morgan', nextCheckAt: now.toISOString() };
        if (observed.error || !observed.exists)
            return { state: 'blocked', reason: observed.error || 'Prerequisite target was not verified', owner: 'Morgan', nextCheckAt: null };
        if (!observed.complete)
            return { state: 'waiting', reason: `Waiting for ${dependency.condition}: ${dependency.target.id}`, owner: 'Morgan', nextCheckAt: new Date(now.getTime() + 60000).toISOString() };
    }
    return null;
}
export function dependencyCompletionKey(dependencies: Prerequisite[], stores: DependencyStores): string {
    return createHash('sha256').update(JSON.stringify(dependencies.map(dependency => {
        const store = stores.get(dependency.target.projectId)!;
        const job = store.state.coordination?.jobs?.find(job => job.id === dependency.target.id || job.key === dependency.target.id);
        const run = store.state.maintenance?.runs.find(run => run.id === dependency.target.id);
        const observed = store.state.coordination?.dependencyObservations?.find(observation => workKey(observation.target) === workKey(dependency.target) && observation.condition === dependency.condition);
        return [workKey(dependency.target), dependency.condition, job?.head || job?.mergeCommit || run?.endedAt || observed?.version || ''];
    }).sort())).digest('hex');
}
/** Provider reads are bounded and separate from queue selection. */
export async function observePrerequisites(dependencies: Prerequisite[], stores: DependencyStores, execute: typeof command = command, now = new Date()): Promise<void> {
    for (const dependency of dependencies) {
        if (dependency.condition === 'job-completed')
            continue;
        const store = stores.get(dependency.target.projectId);
        if (!store?.state.coordination)
            continue;
        const observations = store.state.coordination.dependencyObservations ??= [];
        const previous = observations.find(observation => workKey(observation.target) === workKey(dependency.target) && observation.condition === dependency.condition);
        if (previous && now.getTime() - Date.parse(previous.observedAt) < 60000)
            continue;
        const observation: DependencyObservation = { target: dependency.target, condition: dependency.condition, exists: false, complete: false, version: '', observedAt: now.toISOString(), error: '' };
        try {
            if (store.project.provider !== 'github') {
                const response = JSON.parse(await execute('twg', ['jira', 'workitem', 'get', dependency.target.id, '--site', store.project.board?.url.split('/secure/')[0] || '', '-o', 'json', '--output-summary', 'none'], { readOnly: true, timeout: 60000 }));
                const issue = response.data;
                if (response.error || !issue || issue.key !== dependency.target.id || !issue.updated)
                    throw new Error('Jira prerequisite identity/version is unverified');
                observation.exists = true;
                observation.complete = !!issue.resolution;
                observation.version = issue.updated;
            }
            else {
                const number = issueKey(dependency.target.id);
                if (!/^\d+$/.test(number))
                    throw new Error('Invalid GitHub prerequisite identity');
                const type = dependency.condition === 'pr-merged' ? 'pulls' : 'issues';
                const result = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/${type}/${number}`], { cwd: store.project.repo, readOnly: true, timeout: 60000 }));
                if (result.number !== Number(number) || !['open', 'closed'].includes(result.state))
                    throw new Error('Prerequisite read returned an incomplete or mismatched identity');
                observation.exists = true;
                observation.complete = dependency.condition === 'pr-merged' ? result.merged === true && !!result.merge_commit_sha : result.state === 'closed';
                observation.version = result.merge_commit_sha || result.updated_at || '';
                if (!observation.version)
                    throw new Error('Prerequisite read lacks a version');
            }
        }
        catch (error) {
            observation.error = String(error);
        }
        if (previous)
            Object.assign(previous, observation);
        else
            observations.push(observation);
        store.save();
    }
}
