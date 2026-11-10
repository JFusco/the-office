/** Stable FNV-1a identities; coordinates never participate in retrieval. */
export function stableHash(id: string) { let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0),16777619); return h >>> 0; }
export function focusPosition(id: string, focus: string, neighbors: string[]) {
    if (id === focus) return { x:0,y:0,z:0 };
    const index = neighbors.indexOf(id), angle = index / Math.max(1,neighbors.length) * Math.PI * 2 - .65, radius = neighbors.length > 12 ? index % 2 ? 63 : 43 : 52;
    return { x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.84,z:Math.sin(angle*2)*12 };
}
export function stablePosition(id: string, sector: string, sectors: string[]) {
    const seed = stableHash(`${sector}:${id}`);
    const sample = (salt: number) => {
        let h = seed ^ salt;
        h = Math.imul(h ^ h >>> 16, 0x7feb352d); h = Math.imul(h ^ h >>> 15, 0x846ca68b);
        return ((h ^ h >>> 16) >>> 0) / 4294967296;
    };
    // A fixed depth field rather than one narrow wedge for every technical note.
    const angle = sample(1) * Math.PI * 2, radius = Math.sqrt(-2 * Math.log(Math.max(.001, sample(2)))) * 55;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .72, z: (sample(3) - .5) * 140 };
}
