type Json = Record<string, unknown>;
const plain = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const identity = (value: unknown): unknown => plain(value) ? value.id ?? value.key : undefined;
/** Only an object that can be written to, and has not already been restored from another place, is restored in place. */
const restorable = (value: unknown, seen: Set<unknown>) => !!value && typeof value === 'object' && !Object.isFrozen(value) && !seen.has(value);

/**
 * Puts `target` back to the contents of `saved` without replacing the objects callers already
 * hold. A stage runner keeps one reference to its ticket or job across a long worker run; if a
 * rolled-back transaction swapped the state for a copy, everything that runner wrote afterwards
 * would land on a discarded object and be lost. Records in a list are matched by `id` or `key`.
 * A frozen object, or one reachable a second time, takes the saved value instead.
 */
export function restoreInPlace(target: unknown, saved: unknown, seen = new Set<unknown>()): void {
    seen.add(target);
    if (Array.isArray(target) && Array.isArray(saved)) {
        const held = new Map<unknown, Json>();
        for (const item of target) { const id = identity(item); if (id !== undefined && !held.has(id)) held.set(id, item as Json); }
        const restored = saved.map(item => {
            const id = identity(item), existing = id === undefined ? undefined : held.get(id);
            if (!existing || !restorable(existing, seen)) return item;
            held.delete(id); restoreInPlace(existing, item, seen); return existing;
        });
        target.length = 0;
        target.push(...restored);
        return;
    }
    if (!plain(target) || !plain(saved)) return;
    for (const key of Object.keys(target)) if (!(key in saved)) delete target[key];
    for (const [key, value] of Object.entries(saved)) {
        const current = target[key];
        if (Object.is(current, value)) continue;
        if ((Array.isArray(current) && Array.isArray(value) || plain(current) && plain(value)) && restorable(current, seen)) restoreInPlace(current, value, seen);
        else target[key] = value;
    }
}
