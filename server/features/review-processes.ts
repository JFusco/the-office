import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { processGroupAlive } from '../workers/process';

/** Persist detached provider groups while a wrapper is active; completed receipts remain evidence. */
export function observeHelperGroups(store: Store, feature: Feature, alive = processGroupAlive): number[] {
    const review = feature.review;
    if (!review?.run) return [];
    const calls = resolve(review.run, 'calls'), groups = new Set(review.processes.filter(alive));
    if (existsSync(calls)) for (const call of readdirSync(calls)) {
        const started = resolve(calls, call, 'started.json'), finished = resolve(calls, call, 'process.json');
        if (!existsSync(started) || review.stoppedCalls?.includes(call)) continue;
        const value = JSON.parse(readFileSync(started, 'utf8'));
        if (!Number.isSafeInteger(value.process_group) || value.process_group <= 1 || value.process_group !== value.pid) throw new Error('Invalid helper process ownership receipt');
        if (alive(value.process_group)) groups.add(value.process_group);
        else if (existsSync(finished)) store.transaction(() => { (review.stoppedCalls ??= []).push(call); });
    }
    if (review.lockPath && existsSync(review.lockPath)) {
        const text = readFileSync(review.lockPath, 'utf8').trim();
        if (text) {
            const lock = JSON.parse(text);
            if (typeof lock.call_dir !== 'string' || !lock.call_dir.startsWith(calls + sep) || !Number.isSafeInteger(lock.process_group) || lock.process_group <= 1)
                throw new Error('Review lock does not identify an owned provider group');
            if (!review.stoppedCalls?.includes(basename(lock.call_dir)) && alive(lock.process_group)) groups.add(lock.process_group);
        }
    }
    const current = [...groups];
    if (JSON.stringify(review.processes) !== JSON.stringify(current)) store.transaction(() => { review.processes = current; });
    return current;
}
export function stopHelperGroups(store: Store, feature: Feature, signal: NodeJS.Signals = 'SIGTERM') {
    for (const group of observeHelperGroups(store, feature)) {
        try { process.kill(-group, signal); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error; }
    }
}
