/** Brain's stable FNV-1a sector layout; coordinates never participate in retrieval. */
export function stableHash(id: string) { let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0),16777619); return h >>> 0; }
export function focusPosition(id: string, focus: string, neighbors: string[]) {
    if (id === focus) return { x:0,y:0,z:0 };
    const index = neighbors.indexOf(id), angle = index / Math.max(1,neighbors.length) * Math.PI * 2 - .65, radius = neighbors.length > 12 ? index % 2 ? 63 : 43 : 52;
    return { x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.84,z:Math.sin(angle*2)*12 };
}
export function stablePosition(id: string, sector: string, sectors: string[]) {
    const h = stableHash(id);
    const d = Math.max(0,sectors.indexOf(sector)), angle = d / Math.max(1,sectors.length) * Math.PI * 2 + h % 1000 / 1000 * .65;
    const radius = 32 + (h >>> 8) % 1000 / 1000 * 96;
    return { x: Math.cos(angle)*radius, y: Math.sin(angle)*radius, z: (h >>> 18) % 1000 / 1000 * 35 - 17.5 };
}
