import type { KnowledgeNode } from '../../contracts/knowledge-views';

/** Stable FNV-1a identities; coordinates never participate in retrieval. */
export function stableHash(id: string) { let h = 2166136261; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0),16777619); return h >>> 0; }

/** Where a Brain domain's cluster sits on the outer rim; Brain notes without a domain share the rim. */
export function domainAnchor(domain: string, domains: readonly string[]) {
    const index = domains.indexOf(domain), angle = (index < 0 ? stableHash(domain) % 1000 / 1000 : index / Math.max(1, domains.length)) * Math.PI * 2 + .35;
    return { x: Math.cos(angle) * RIM, y: Math.sin(angle) * RIM * .62, z: Math.sin(angle * 2) * 18 };
}

const RIM = 150;

/**
 * A small solar system around the project: Office lessons orbit in an inner disc, employee assignments in a
 * ring beyond them, and each Brain domain forms its own cluster on the outer rim. Positions are a pure function
 * of identity, kind and domain, so they stay put through navigation and never route knowledge.
 */
export function stablePosition(id: string, kind: KnowledgeNode['kind'], domain = '', domains: readonly string[] = []) {
    const seed = stableHash(`${kind}:${id}`);
    const sample = (salt: number) => {
        let h = seed ^ salt;
        h = Math.imul(h ^ h >>> 16, 0x7feb352d); h = Math.imul(h ^ h >>> 15, 0x846ca68b);
        return ((h ^ h >>> 16) >>> 0) / 4294967296;
    };
    const angle = sample(1) * Math.PI * 2;
    if (kind === 'lesson') { const radius = 26 + Math.sqrt(sample(2)) * 52; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .6, z: (sample(3) - .5) * 30 }; }
    if (kind === 'assignment') { const radius = 92 + sample(2) * 22; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .6, z: (sample(3) - .5) * 36 }; }
    if (kind === 'technical' && domain) {
        const anchor = domainAnchor(domain, domains), spread = Math.sqrt(-2 * Math.log(Math.max(.001, sample(2)))) * 11, tilt = (sample(3) - .5) * Math.PI;
        return { x: anchor.x + Math.cos(angle) * Math.cos(tilt) * spread, y: anchor.y + Math.sin(angle) * Math.cos(tilt) * spread, z: anchor.z + Math.sin(tilt) * spread };
    }
    const radius = RIM - 12 + sample(2) * 44;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .62, z: (sample(3) - .5) * 50 };
}
